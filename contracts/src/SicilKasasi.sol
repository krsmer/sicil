// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IWorkshopHub {
    function checkIn(string calldata name, uint256 agentId) external;
}

/// @title SicilKasasi
/// @notice SİCİL'in zincirdeki kasası: trader her emirden önce kararını mühürler (seal), emirden sonra açıklar (reveal);
///         bağımsız denetçi hesabın bütün dolumlarını mühürlerle eşleyip sonucu yazar (attest). Mühürsüz tek bir işlem
///         sicili kalıcı olarak bozar. Limitler deploy'da verilir ve değişmez.
/// @dev Avalanche Fuji, evm_version = cancun. Tutarlar USDT cent (1 USDT = 100), fiyat ve miktar 1e8 ölçekli.
contract SicilKasasi {
    struct Muhur {
        bytes32 commitHash;
        string pair;
        uint64 notionalCent;
        uint64 ts;
        bool acik;
    }

    /// @notice reveal'de priceE8 * sizeE8 tutarının mühürdeki tutarı aşabileceği yuvarlama payı.
    uint256 public constant TOLERANS_CENT = 1;
    /// @dev priceE8 * sizeE8 = USDT * 1e16 = cent * 1e14
    uint256 private constant E16_CENT = 1e14;
    /// @dev clOrdId = "sicil" + 6 hane
    uint256 private constant MAX_MUHUR = 999_999;

    address public immutable sahip;
    address public immutable trader;
    address public immutable denetci;
    address public immutable fren;
    uint256 public immutable maxTutarCent;
    uint256 public immutable beklemeSn;
    uint256 public immutable maxGunlukZararCent;
    uint256 public immutable aciklamaPenceresiSn;

    mapping(bytes32 => bool) public pariteIzinli;
    string[] private _pariteler;

    uint64 public sicilBaslangic;
    bool public durduruldu;
    bool public sicilBozuk;
    uint256 public muhurSayisi;
    uint64 public sonMuhurTs;
    uint64 public sonDenetimTs;
    mapping(uint256 => Muhur) private _muhurler;

    event KurallarAyarlandi(string[] pariteler, uint256 maxTutarCent, uint256 beklemeSn, uint256 maxGunlukZararCent, uint256 aciklamaPenceresiSn);
    event SicilBaslangicAyarlandi(uint64 ts);
    event Sealed(uint256 indexed id, bytes32 commitHash, string pair, uint256 notionalCent, uint256 ts);
    event Revealed(
        uint256 indexed id,
        uint8 side,
        uint256 priceE8,
        uint256 sizeE8,
        string thesis,
        uint8 confidence,
        bytes32 salt,
        string okxOrdId
    );
    event Attested(
        uint64 indexed upToTs,
        uint256 matched,
        uint256 unmatched,
        uint256 unrevealedExpired,
        int256 dayPnlCent,
        bytes32 reportHash
    );
    event SicilBozuldu(uint64 upToTs, uint256 unmatched, bytes32 reportHash);
    event Paused(address indexed by);
    event Unpaused(address indexed by);

    error YetkiYok();
    error GecersizAdres();
    error Durduruldu();
    error PariteIzinsiz(string pair);
    error TutarSifir();
    error TutarAsildi(uint256 notionalCent, uint256 maxTutarCent);
    error BeklemeDolmadi(uint256 kalanSn);
    error MuhurLimiti();
    error MuhurYok(uint256 id);
    error ZatenAcik(uint256 id);
    error PencereKapandi(uint256 id);
    error GecersizYon();
    error GecersizGuven();
    error HashUyusmuyor(uint256 id);
    error AciklananTutarAsildi(uint256 id, uint256 aciklananCentE14, uint256 muhurCent);
    error BaslangicZatenAyarli();
    error BaslangicAyarsiz();
    error GecersizDenetimZamani();

    modifier sadece(address yetkili) {
        if (msg.sender != yetkili) revert YetkiYok();
        _;
    }

    constructor(
        address _sahip,
        address _trader,
        address _denetci,
        address _fren,
        string[] memory pariteler,
        uint256 _maxTutarCent,
        uint256 _beklemeSn,
        uint256 _maxGunlukZararCent,
        uint256 _aciklamaPenceresiSn
    ) {
        if (_sahip == address(0) || _trader == address(0) || _denetci == address(0) || _fren == address(0)) {
            revert GecersizAdres();
        }
        // Denetçi trader ya da sahip olamaz: "kendi notunu kendi veremez".
        if (_denetci == _trader || _denetci == _sahip) revert GecersizAdres();
        sahip = _sahip;
        trader = _trader;
        denetci = _denetci;
        fren = _fren;
        maxTutarCent = _maxTutarCent;
        beklemeSn = _beklemeSn;
        maxGunlukZararCent = _maxGunlukZararCent;
        aciklamaPenceresiSn = _aciklamaPenceresiSn;
        for (uint256 i; i < pariteler.length; ++i) {
            pariteIzinli[keccak256(bytes(pariteler[i]))] = true;
            _pariteler.push(pariteler[i]);
        }
        emit KurallarAyarlandi(pariteler, _maxTutarCent, _beklemeSn, _maxGunlukZararCent, _aciklamaPenceresiSn);
    }

    // ---------------------------------------------------------------- sahip

    /// @notice Sicilin başladığı an. Sadece bir kez ve sadece "şimdi" olarak ayarlanır; geriye tarih atılamaz.
    function setSicilBaslangic() external sadece(sahip) {
        if (sicilBaslangic != 0) revert BaslangicZatenAyarli();
        sicilBaslangic = uint64(block.timestamp);
        emit SicilBaslangicAyarlandi(sicilBaslangic);
    }

    function unpause() external sadece(sahip) {
        durduruldu = false;
        emit Unpaused(msg.sender);
    }

    /// @notice Team1 atölye panosuna kayıt. Hub sadece kontrattan gelen çağrıyı kabul eder.
    function report(address hub, string calldata name, uint256 agentId) external sadece(sahip) {
        IWorkshopHub(hub).checkIn(name, agentId);
    }

    // ---------------------------------------------------------------- fren

    function pause() external {
        if (msg.sender != fren && msg.sender != sahip) revert YetkiYok();
        durduruldu = true;
        emit Paused(msg.sender);
    }

    // ---------------------------------------------------------------- trader

    /// @notice Emirden önce kararı mühürler. Parite ve tutar açık (limitler burada uygulanır); yön, fiyat ve tez hash'te gizli.
    function seal(bytes32 commitHash, string calldata pair, uint256 notionalCent)
        external
        sadece(trader)
        returns (uint256 id)
    {
        if (durduruldu) revert Durduruldu();
        if (!pariteIzinli[keccak256(bytes(pair))]) revert PariteIzinsiz(pair);
        if (notionalCent == 0) revert TutarSifir();
        if (notionalCent > maxTutarCent) revert TutarAsildi(notionalCent, maxTutarCent);
        if (sonMuhurTs != 0 && block.timestamp < sonMuhurTs + beklemeSn) {
            revert BeklemeDolmadi(sonMuhurTs + beklemeSn - block.timestamp);
        }
        if (muhurSayisi >= MAX_MUHUR) revert MuhurLimiti();

        id = ++muhurSayisi;
        sonMuhurTs = uint64(block.timestamp);
        _muhurler[id] = Muhur(commitHash, pair, uint64(notionalCent), uint64(block.timestamp), false);
        emit Sealed(id, commitHash, pair, notionalCent, block.timestamp);
    }

    /// @notice Mührü açıklar. Kontrat durdurulmuş olsa da açıklama yapılabilir (dürüstlük).
    /// @param okxOrdId Emir OKX'e gidemediyse boş.
    function reveal(
        uint256 id,
        uint8 side,
        uint256 priceE8,
        uint256 sizeE8,
        string calldata thesis,
        uint8 confidence,
        bytes32 salt,
        string calldata okxOrdId
    ) external sadece(trader) {
        Muhur storage m = _muhurler[id];
        if (m.ts == 0) revert MuhurYok(id);
        if (m.acik) revert ZatenAcik(id);
        if (block.timestamp > m.ts + aciklamaPenceresiSn) revert PencereKapandi(id);
        if (side > 1) revert GecersizYon();
        if (confidence > 100) revert GecersizGuven();
        if (commitHashHesapla(m.pair, side, priceE8, sizeE8, thesis, confidence, salt) != m.commitHash) {
            revert HashUyusmuyor(id);
        }
        uint256 aciklanan = priceE8 * sizeE8;
        if (aciklanan > (uint256(m.notionalCent) + TOLERANS_CENT) * E16_CENT) {
            revert AciklananTutarAsildi(id, aciklanan, m.notionalCent);
        }

        m.acik = true;
        emit Revealed(id, side, priceE8, sizeE8, thesis, confidence, salt, okxOrdId);
    }

    // ---------------------------------------------------------------- denetçi

    /// @param upToTs Raporun kapsadığı son an; önceki rapordan sonra, sicilBaslangic'ten sonra, şimdiden önce.
    /// @param unmatched Mühürle eşleşmeyen dolan emir sayısı. > 0 ise sicil kalıcı olarak bozulur.
    /// @param unrevealedExpired Açıklama penceresi dolup açıklanmamış mühür sayısı ("tutmadı").
    /// @param dayPnlCent sicilBaslangic'ten bu yana net kâr/zarar (USDT cent, ücretler dahil, işaretli).
    function attest(
        uint64 upToTs,
        uint256 matched,
        uint256 unmatched,
        uint256 unrevealedExpired,
        int256 dayPnlCent,
        bytes32 reportHash
    ) external sadece(denetci) {
        if (sicilBaslangic == 0) revert BaslangicAyarsiz();
        if (upToTs <= sonDenetimTs || upToTs < sicilBaslangic || upToTs > block.timestamp) {
            revert GecersizDenetimZamani();
        }
        sonDenetimTs = upToTs;
        emit Attested(upToTs, matched, unmatched, unrevealedExpired, dayPnlCent, reportHash);

        if (unmatched > 0 && !sicilBozuk) {
            sicilBozuk = true;
            emit SicilBozuldu(upToTs, unmatched, reportHash);
        }
        if (dayPnlCent <= -int256(maxGunlukZararCent) && !durduruldu) {
            durduruldu = true;
            emit Paused(msg.sender);
        }
    }

    // ---------------------------------------------------------------- okuma

    function commitHashHesapla(
        string memory pair,
        uint8 side,
        uint256 priceE8,
        uint256 sizeE8,
        string memory thesis,
        uint8 confidence,
        bytes32 salt
    ) public pure returns (bytes32) {
        return keccak256(abi.encode(pair, side, priceE8, sizeE8, thesis, confidence, salt));
    }

    function muhur(uint256 id)
        external
        view
        returns (bytes32 commitHash, string memory pair, uint256 notionalCent, uint256 ts, bool acik)
    {
        Muhur storage m = _muhurler[id];
        return (m.commitHash, m.pair, m.notionalCent, m.ts, m.acik);
    }

    function pariteler() external view returns (string[] memory) {
        return _pariteler;
    }
}
