#!/bin/bash
# SİCİL trader ajanını Mac uyumadan (caffeinate) ve çökerse kendini yeniden başlatarak çalıştırır.
# Başlat:  nohup agents/trader/calistir.sh >/dev/null 2>&1 &
# Durdur:  touch agents/logs/DUR && pkill -TERM -f "node trader/ajan.mjs"   (tur ortasındaysa tur bitince çıkar)
cd "$(dirname "$0")/.." || exit 1
mkdir -p logs
rm -f logs/DUR
while true; do
  echo "$(date -u +%FT%TZ) calistir: ajan başlatılıyor" >> logs/ajan.out
  caffeinate -ims node trader/ajan.mjs >> logs/ajan.out 2>&1
  kod=$?
  if [ -f logs/DUR ]; then
    echo "$(date -u +%FT%TZ) calistir: DUR dosyası var, döngü bitti (exit $kod)" >> logs/ajan.out
    break
  fi
  echo "$(date -u +%FT%TZ) calistir: ajan çıktı (exit $kod), 15 sn sonra yeniden başlatılıyor" >> logs/ajan.out
  sleep 15
done
