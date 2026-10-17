#!/bin/bash
# SİCİL denetçi ajanını Mac uyumadan (caffeinate) ve çökerse kendini yeniden başlatarak çalıştırır.
# Başlat:  nohup agents/denetci/calistir.sh >/dev/null 2>&1 &      (aralık: DENETCI_ARALIK_SN, varsayılan 60; sunumda 15)
# Durdur:  touch agents/logs/DUR-DENETCI && pkill -TERM -f "node denetci/denetci.mjs"
cd "$(dirname "$0")/.." || exit 1
mkdir -p logs
rm -f logs/DUR-DENETCI
while true; do
  echo "$(date -u +%FT%TZ) calistir: denetçi başlatılıyor" >> logs/denetci.out
  caffeinate -ims node denetci/denetci.mjs >> logs/denetci.out 2>&1
  kod=$?
  if [ -f logs/DUR-DENETCI ]; then
    echo "$(date -u +%FT%TZ) calistir: DUR-DENETCI dosyası var, döngü bitti (exit $kod)" >> logs/denetci.out
    break
  fi
  echo "$(date -u +%FT%TZ) calistir: denetçi çıktı (exit $kod), 15 sn sonra yeniden başlatılıyor" >> logs/denetci.out
  sleep 15
done
