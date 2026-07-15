---
title: MacBookでBetterDisplayを使って画面操作を試みるも「HDMIの闇」に直撃して爆死しかけた話
description: BetterDisplayでモニターの入力切り替えができない原因は、USB-C to HDMIケーブルがDDC/CI通信を通していなかったこと。映像が映る＝DDC/CIも通る、とは限らないという罠の記録。
pubDate: 2026-07-16
tags: [mac, hardware]
---

MacBookを使っていて、「外部モニターの輝度や入力ソースをキーボードから直接コントロールしたい」と思ったことはありませんか？

それを実現してくれるのが[BetterDisplay](https://github.com/waydabber/BetterDisplay)や[MonitorControl](https://github.com/MonitorControl/MonitorControl)といったアプリです。これらはDDC/CIというプロトコルを使って、モニター本体の設定をソフトウェアから操作できます。

私はWindowsとMacで同じモニターを共有しているので、「Mac側からソフトウェアで入力切り替えができれば、モニターの背面ボタンをポチポチする生活から解放される」と考えてBetterDisplayを導入しました。

「KVMスイッチ買えよ」というツッコミが聞こえてきそうですが、そこまで頻繁に切り替えるわけでもないので、ケーブルとソフトウェアで済むならそれで十分と判断しました（本音を言うと、ちゃんとしたKVMスイッチは普通に高い）。

ちなみにWindows側はPowerToysの[PowerDisplay](https://learn.microsoft.com/en-us/windows/powertoys/power-display)で同様の画面操作を実現済みです。こちらは何もハマらず、すんなり動きました。ハマったのはMac側だけです。

しかし、ここにはMac特有の「HDMI接続に関する深い闇」が潜んでいました。同じ罠にハマって時間を溶かす人が減るように、検証結果と解決策を書き残しておきます。

先に結論を書くと、**原因はBetterDisplayでもモニターでもなく、USB-C to HDMIケーブルがDDC/CI通信を通していなかったこと**でした。USB-C to DisplayPortケーブルに変えたら一発で解決しました。

## 環境

| 項目         | 内容                                             |
| ------------ | ------------------------------------------------ |
| PC           | MacBook Air（M4）                                |
| モニター1    | ASUS（HDMI接続）                                 |
| モニター2    | IIYAMA（Anker PowerExpand 6-in-1経由でHDMI接続） |
| アプリ       | BetterDisplay                                    |
| やりたいこと | Macからモニターの入力ソースを切り替える          |

## 発生した問題

BetterDisplayからIIYAMAモニターの入力切り替えはできたのに、**ASUSモニターだけ切り替えられない**という現象が発生しました。

接続方法は次のとおりです。

| モニター | 接続経路                     | 入力切り替え |
| -------- | ---------------------------- | -----------: |
| IIYAMA   | Mac → Anker USB-Cハブ → HDMI |         成功 |
| ASUS     | Mac → USB-C to HDMIケーブル  |         失敗 |

どちらも最終的にはHDMIでモニターに入っているのに、片方だけDDC/CIが通らない。この時点ではまったく意味が分かりませんでした。

## モニター側のDDC/CI設定を疑う

まずASUSモニター本体のOSD（背面のボタンやジョイスティックで開く設定画面）を確認しました。

すると、DDC/CIの項目は「ON」になっているものの、グレーアウトしていて変更できない状態でした。一瞬「無効化されてる？」と焦りましたが、これはDDC/CIが無効という意味ではなく、**ON固定で変更できない**だけでした。

つまり、モニター側の設定は原因ではありませんでした。

## 犯人はUSB-C to HDMIケーブルだった

試しにASUSモニターとの接続を、USB-C to HDMIケーブルからUSB-C to DisplayPort 1.4ケーブルに変更してみました。

変更前：

```text
Mac
  ↓
USB-C to HDMIケーブル
  ↓
ASUSモニター
```

変更後：

```text
Mac
  ↓
USB-C to DisplayPortケーブル
  ↓
ASUSモニター
```

すると、BetterDisplayから**何事もなかったかのように入力切り替えが成功**。輝度変更も含めてDDC/CIコマンドが完全に安定して通るようになりました。

## なぜHDMIケーブルだとDDC/CIが死ぬのか

MacBook AirのUSB-Cポートは、映像をDisplayPort信号（DP Alt Mode）として出力しています。USB-C to HDMIケーブルを使う場合、ケーブル内部の変換チップがDisplayPort信号をHDMI信号へ変換しています。

問題はこの変換のとき。DDC/CIの通信は、DisplayPortではAUXチャンネル、HDMIではDDCラインという別々の経路を通ります。変換チップの実装によっては、**映像信号は変換できても、DDC/CI通信を正しくHDMI側へ中継できない**ことがあるのです。

つまり、

```text
映像が表示できる = DDC/CIも使える
```

とは限らない。映像は正常に映っているので、ケーブルを疑うという発想になかなか至らない。これがこの罠の一番いやらしいところでした。

## 奇妙な現象：Ankerハブ経由のHDMIだと動く理由

ここで冒頭の謎に戻ります。IIYAMAモニターは「Anker PowerExpand 6-in-1 → HDMI」という構成なのに、DDC/CIが問題なく動いていました。

これはAnkerハブ内部の変換チップが優秀で、DisplayPort信号をHDMIに変換する際に、**AUXチャンネル内のDDC/CI通信もHDMIのDDCラインへ正しくマッピングしてくれていた**からだと考えられます。ハブのチップが「通訳」として機能していたわけです。

つまり、USB-CからHDMIへの変換がすべてダメなのではなく、**間に入るケーブル・アダプタ・ハブの変換チップの実装次第でDDC/CIの可否が変わる**ということになります。同じ「HDMI接続」に見えても、中身はガチャなのです。

このガチャ、私の環境ではAnker PowerExpand 6-in-1が当たりでした。DDC/CIがうまく通るハブの動作報告はRedditなどの海外コミュニティでも散見されるので、ハブ経由で使いたい場合は「製品名 + DDC」で検索してから買うと当たりを引ける確率が上がります。

## 今回の検証結果まとめ

| 接続方法                                  | 映像出力 | 入力切り替え |
| ----------------------------------------- | -------: | -----------: |
| Mac → USB-C to HDMIケーブル → ASUS        |     成功 |         失敗 |
| Mac → USB-C to DisplayPortケーブル → ASUS |     成功 |         成功 |
| Mac → Ankerハブ → HDMI → IIYAMA           |     成功 |         成功 |

## BetterDisplayで入力切り替えできないときの確認事項

同じ問題にハマったら、以下の順で確認するのがおすすめです。

1. モニター本体のOSDでDDC/CIがONになっているか
2. BetterDisplayから輝度変更などの他のDDC操作ができるか
3. USB-C to HDMIケーブルや変換アダプタを使っていないか
4. USB-C to DisplayPortケーブルへ変更できないか
5. 別のUSB-CハブやHDMIアダプタでは動作するか

特に「映像が正常に映っているから」という理由で、ケーブルを原因候補から外さないこと。ここが最大の落とし穴です。

## まとめ

- BetterDisplayで入力切り替えができないとき、疑うべきはアプリやモニターの設定だけでなく、**接続ケーブルがDDC/CI通信を通せるかどうか**
- MacとモニターをUSB-Cで直結するなら、変換チップを挟まない**USB-C to DisplayPortケーブルが確実**
- HDMIで繋ぐ場合は、間に入る変換チップの実装次第でDDC/CIが通ったり通らなかったりする「ガチャ」になる

最終的に、キーボードショートカット一発でモニターの輝度変更もWindowsマシンへの入力切り替えも決まる快適なデスク環境が完成しました。WindowsとMacでモニターを共用している人の参考になれば幸いです。

## 参考

- [DDC and DisplayPort - ddcutil Documentation](https://www.ddcutil.com/displayport/)（DDC/CIがDisplayPortではAUXチャンネル、HDMIでは専用のDDCライン（I2C）を通ること、変換時にチップがI2C信号を変換する仕組みの解説）
- [USB-C DisplayPort Alt Mode - ddcutil Documentation](https://www.ddcutil.com/typec/)（USB-CのDP Alt ModeでAUXチャンネルがどう運ばれるかの解説）
- [Losing hardware DDC due to USB-C to HDMI connection? - MonitorControl Discussion #900](https://github.com/MonitorControl/MonitorControl/discussions/900)（DP→HDMI変換チップがDDCの中継に対応しているかは製品次第で、スペック表にも書かれていないという報告）
- [MacBook Air (13インチ, M4, 2025) - 技術仕様 - Apple](https://support.apple.com/en-us/122209)（Thunderbolt 4ポートがネイティブDisplayPort 1.4出力に対応）
- [PowerToys Power Display utility for Windows - Microsoft Learn](https://learn.microsoft.com/en-us/windows/powertoys/power-display)
