// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {SicilKasasi} from "../src/SicilKasasi.sol";

contract HubMock {
    address public cagiran;
    string public isim;
    uint256 public agentId;

    function checkIn(string calldata name, uint256 _agentId) external {
        require(msg.sender.code.length > 0, "sadece kontrat cagirabilir");
        cagiran = msg.sender;
        isim = name;
        agentId = _agentId;
    }
}

contract SicilKasasiTest is Test {
    event Sealed(uint256 indexed id, bytes32 commitHash, string pair, uint256 notionalCent, uint256 ts);
    event SicilBozuldu(uint64 upToTs, uint256 unmatched, bytes32 reportHash);
    event Paused(address indexed by);

    SicilKasasi k;
    address sahip = makeAddr("sahip");
    address trader = makeAddr("trader");
    address denetci = makeAddr("denetci");
    address fren = makeAddr("fren");
    address yabanci = makeAddr("yabanci");

    // 80.000 USDT x 0,00025 BTC = 20,00 USDT = 2000 cent
    uint256 constant PX = 80_000e8;
    uint256 constant SZ = 25_000;
    string constant TEZ = '{"hedefPct":1.5,"gecersizlikPct":0.8,"sureDk":120,"guven":65}';
    bytes32 constant SALT = keccak256("tuz-1");

    function setUp() public {
        vm.warp(1_792_220_000);
        string[] memory p = new string[](2);
        p[0] = "BTC-USDT";
        p[1] = "ETH-USDT";
        k = new SicilKasasi(sahip, trader, denetci, fren, p, 2000, 300, 5000, 3 hours);
    }

    function _muhurle(uint256 notionalCent, uint256 sz) internal returns (uint256 id) {
        bytes32 h = k.commitHashHesapla("BTC-USDT", 0, PX, sz, TEZ, 65, SALT);
        vm.prank(trader);
        id = k.seal(h, "BTC-USDT", notionalCent);
    }

    function _acikla(uint256 id, uint256 sz) internal {
        vm.prank(trader);
        k.reveal(id, 0, PX, sz, TEZ, 65, SALT, "4017254314926780417");
    }

    // ------------------------------------------------------------ hash: zincir dışı (viem) == kontrat

    function test_CommitHash_ViemIleAyni() public {
        string[] memory cmd = new string[](9);
        cmd[0] = "node";
        cmd[1] = "../agents/shared/commit.mjs";
        cmd[2] = "BTC-USDT";
        cmd[3] = "0";
        cmd[4] = vm.toString(PX);
        cmd[5] = vm.toString(SZ);
        cmd[6] = TEZ;
        cmd[7] = "65";
        cmd[8] = vm.toString(SALT);
        bytes32 zincirDisi = bytes32(vm.ffi(cmd));
        assertEq(zincirDisi, k.commitHashHesapla("BTC-USDT", 0, PX, SZ, TEZ, 65, SALT));
        // Aynı hash ile mühür + açıklama uçtan uca geçer
        vm.prank(trader);
        uint256 id = k.seal(zincirDisi, "BTC-USDT", 2000);
        _acikla(id, SZ);
        (,,,, bool acik) = k.muhur(id);
        assertTrue(acik);
    }

    // ------------------------------------------------------------ seal: limitler

    function test_Seal_PariteDuzMetinYayinlanir() public {
        bytes32 h = keccak256("x");
        vm.expectEmit(true, false, false, true);
        emit Sealed(1, h, "ETH-USDT", 1500, vm.getBlockTimestamp());
        vm.prank(trader);
        k.seal(h, "ETH-USDT", 1500);
    }

    function test_Seal_IzinsizPariteReddedilir() public {
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.PariteIzinsiz.selector, "BTC-TRY"));
        k.seal(keccak256("x"), "BTC-TRY", 1000);
    }

    function test_Seal_TutarLimitiAsilirsaReddedilir() public {
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.TutarAsildi.selector, 3400, 2000));
        k.seal(keccak256("x"), "BTC-USDT", 3400);
    }

    function test_Seal_SifirTutarReddedilir() public {
        vm.prank(trader);
        vm.expectRevert(SicilKasasi.TutarSifir.selector);
        k.seal(keccak256("x"), "BTC-USDT", 0);
    }

    function test_Seal_BeklemeSuresi() public {
        _muhurle(2000, SZ);
        vm.warp(vm.getBlockTimestamp() + 299);
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.BeklemeDolmadi.selector, 1));
        k.seal(keccak256("y"), "BTC-USDT", 2000);
        vm.warp(vm.getBlockTimestamp() + 1);
        vm.prank(trader);
        assertEq(k.seal(keccak256("y"), "BTC-USDT", 2000), 2);
    }

    function test_Seal_SadeceTrader() public {
        vm.prank(yabanci);
        vm.expectRevert(SicilKasasi.YetkiYok.selector);
        k.seal(keccak256("x"), "BTC-USDT", 1000);
    }

    // ------------------------------------------------------------ reveal: hash, pencere

    function test_Reveal_YanlisHashReddedilir() public {
        uint256 id = _muhurle(2000, SZ);
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.HashUyusmuyor.selector, id));
        k.reveal(id, 1, PX, SZ, TEZ, 65, SALT, ""); // yön değiştirilmiş
    }

    function test_Reveal_IkiKezAciklanamaz() public {
        uint256 id = _muhurle(2000, SZ);
        _acikla(id, SZ);
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.ZatenAcik.selector, id));
        k.reveal(id, 0, PX, SZ, TEZ, 65, SALT, "");
    }

    function test_Reveal_PencereDolunca_Reddedilir() public {
        uint256 id = _muhurle(2000, SZ);
        vm.warp(vm.getBlockTimestamp() + 3 hours + 1);
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.PencereKapandi.selector, id));
        k.reveal(id, 0, PX, SZ, TEZ, 65, SALT, "");
    }

    function test_Reveal_DurdurulmusKontrattaYapilabilir() public {
        uint256 id = _muhurle(2000, SZ);
        vm.prank(fren);
        k.pause();
        _acikla(id, SZ);
    }

    // ------------------------------------------------------------ reveal: tutar tutarlılığı

    function test_Tutar_TamEsit() public {
        uint256 id = _muhurle(2000, SZ); // 20,00 USDT
        _acikla(id, SZ);
    }

    function test_Tutar_ToleransIcinde() public {
        uint256 sz = 25_012; // 80.000 x 0,00025012 = 20,0096 USDT ≤ 20,01
        uint256 id = _muhurle(2000, sz);
        _acikla(id, sz);
    }

    function test_Tutar_AsilirsaReddedilir() public {
        uint256 sz = 25_013; // 20,0104 USDT > 20,01
        uint256 id = _muhurle(2000, sz);
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.AciklananTutarAsildi.selector, id, PX * sz, 2000));
        k.reveal(id, 0, PX, sz, TEZ, 65, SALT, "");
    }

    function test_Tutar_KucukMuhurBuyukEmirGizleyemez() public {
        // 5 USDT mühürleyip 20 USDT'lik emri açıklamak
        uint256 id = _muhurle(500, SZ);
        vm.prank(trader);
        vm.expectRevert(abi.encodeWithSelector(SicilKasasi.AciklananTutarAsildi.selector, id, PX * SZ, 500));
        k.reveal(id, 0, PX, SZ, TEZ, 65, SALT, "");
    }

    // ------------------------------------------------------------ sicilBaslangic

    function test_SicilBaslangic_BlockTimestampVeBirKez() public {
        vm.prank(sahip);
        k.setSicilBaslangic();
        assertEq(k.sicilBaslangic(), vm.getBlockTimestamp());
        vm.warp(vm.getBlockTimestamp() + 1 hours);
        vm.prank(sahip);
        vm.expectRevert(SicilKasasi.BaslangicZatenAyarli.selector);
        k.setSicilBaslangic();
    }

    function test_SicilBaslangic_SadeceSahip() public {
        vm.prank(trader);
        vm.expectRevert(SicilKasasi.YetkiYok.selector);
        k.setSicilBaslangic();
    }

    // ------------------------------------------------------------ attest: bozulma, otomatik fren

    function _baslat() internal {
        vm.prank(sahip);
        k.setSicilBaslangic();
        vm.warp(vm.getBlockTimestamp() + 60);
    }

    function test_Attest_BaslangicOlmadanReddedilir() public {
        vm.prank(denetci);
        vm.expectRevert(SicilKasasi.BaslangicAyarsiz.selector);
        k.attest(uint64(vm.getBlockTimestamp()), 0, 0, 0, 0, bytes32(0));
    }

    function test_Attest_SadeceDenetci() public {
        _baslat();
        vm.prank(trader);
        vm.expectRevert(SicilKasasi.YetkiYok.selector);
        k.attest(uint64(vm.getBlockTimestamp()), 1, 0, 0, 0, bytes32(0));
    }

    function test_Attest_MuhursuzIslemSiciliKaliciBozar() public {
        _baslat();
        vm.expectEmit(false, false, false, true);
        emit SicilBozuldu(uint64(vm.getBlockTimestamp()), 1, keccak256("rapor-1"));
        vm.prank(denetci);
        k.attest(uint64(vm.getBlockTimestamp()), 3, 1, 0, 120, keccak256("rapor-1"));
        assertTrue(k.sicilBozuk());

        // Sonraki temiz rapor bozukluğu silemez
        vm.warp(vm.getBlockTimestamp() + 60);
        vm.prank(denetci);
        k.attest(uint64(vm.getBlockTimestamp()), 4, 0, 0, 150, keccak256("rapor-2"));
        assertTrue(k.sicilBozuk());
    }

    function test_Attest_ZamanGeriGidemez() public {
        _baslat();
        uint64 t = uint64(vm.getBlockTimestamp());
        vm.prank(denetci);
        k.attest(t, 0, 0, 0, 0, bytes32(0));
        vm.prank(denetci);
        vm.expectRevert(SicilKasasi.GecersizDenetimZamani.selector);
        k.attest(t, 0, 0, 0, 0, bytes32(0));
    }

    function test_Attest_GelecekVeBaslangicOncesiReddedilir() public {
        _baslat();
        uint64 baslangic = k.sicilBaslangic();
        vm.startPrank(denetci);
        vm.expectRevert(SicilKasasi.GecersizDenetimZamani.selector);
        k.attest(uint64(vm.getBlockTimestamp() + 1), 0, 0, 0, 0, bytes32(0));
        vm.expectRevert(SicilKasasi.GecersizDenetimZamani.selector);
        k.attest(baslangic - 1, 0, 0, 0, 0, bytes32(0));
        vm.stopPrank();
    }

    function test_Attest_GunlukZararLimitiOtomatikFren() public {
        _baslat();
        vm.prank(denetci);
        k.attest(uint64(vm.getBlockTimestamp()), 2, 0, 0, -4999, bytes32(0));
        assertFalse(k.durduruldu());

        vm.warp(vm.getBlockTimestamp() + 60);
        vm.expectEmit(true, false, false, false);
        emit Paused(denetci);
        vm.prank(denetci);
        k.attest(uint64(vm.getBlockTimestamp()), 2, 0, 0, -5000, bytes32(0));
        assertTrue(k.durduruldu());

        vm.prank(trader);
        vm.expectRevert(SicilKasasi.Durduruldu.selector);
        k.seal(keccak256("x"), "BTC-USDT", 1000);
    }

    // ------------------------------------------------------------ fren

    function test_Fren_FrenVeSahipDurdurur_YabanciDurduramaz() public {
        vm.prank(yabanci);
        vm.expectRevert(SicilKasasi.YetkiYok.selector);
        k.pause();

        vm.prank(fren);
        k.pause();
        assertTrue(k.durduruldu());

        vm.prank(trader);
        vm.expectRevert(SicilKasasi.Durduruldu.selector);
        k.seal(keccak256("x"), "BTC-USDT", 1000);

        vm.prank(sahip);
        k.unpause();
        vm.prank(sahip);
        k.pause();
        assertTrue(k.durduruldu());
    }

    function test_Fren_SadeceSahipAcabilir() public {
        vm.prank(fren);
        k.pause();
        vm.prank(fren);
        vm.expectRevert(SicilKasasi.YetkiYok.selector);
        k.unpause();
        vm.prank(sahip);
        k.unpause();
        assertFalse(k.durduruldu());
    }

    // ------------------------------------------------------------ kurulum ve report

    function test_Kurulum_DenetciTraderVeyaSahipOlamaz() public {
        string[] memory p = new string[](1);
        p[0] = "BTC-USDT";
        vm.expectRevert(SicilKasasi.GecersizAdres.selector);
        new SicilKasasi(sahip, trader, trader, fren, p, 2000, 300, 5000, 3 hours);
        vm.expectRevert(SicilKasasi.GecersizAdres.selector);
        new SicilKasasi(sahip, trader, sahip, fren, p, 2000, 300, 5000, 3 hours);
    }

    function test_Kurulum_Pariteler() public view {
        string[] memory p = k.pariteler();
        assertEq(p.length, 2);
        assertEq(p[0], "BTC-USDT");
        assertEq(p[1], "ETH-USDT");
        assertTrue(k.pariteIzinli(keccak256("ETH-USDT")));
        assertFalse(k.pariteIzinli(keccak256("BTC-TRY")));
    }

    function test_Report_KontrattanCheckIn() public {
        HubMock hub = new HubMock();
        vm.prank(sahip);
        k.report(address(hub), unicode"SİCİL", 258);
        assertEq(hub.cagiran(), address(k));
        assertEq(hub.agentId(), 258);
    }
}
