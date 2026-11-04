# SeCord (SoulEater)

SeCord é um aplicativo Windows separado do Discord original. Usa a base aberta do [Vesktop](https://github.com/Vencord/Vesktop) e incorpora o [cliente SeCord](https://github.com/nociferico/SeCord-Client). Tem executável, ícone e dados próprios. Não modifica os arquivos do Discord instalado.

## Instalar

O instalador está disponível na página [Releases](https://github.com/nociferico/SeCord-Desktop/releases), quando publicado. Ao compilar localmente, ele fica em `release/SeCord Setup 0.2.1.exe`. O arquivo `release/win-unpacked/SeCord.exe` é apenas para teste dentro da pasta completa. O instalador local não tem assinatura digital.

## Extensões e favoritos

A tela **Extensões** está em português. As descrições e opções comuns foram traduzidas; nomes técnicos das extensões permanecem reconhecíveis. A lista mostra primeiro **Favoritas**, depois **Mais úteis para começar** e, abaixo, as demais. Clique na estrela de um cartão para fixar ou desafixar.

**MessageLogger** vem ativado por padrão em instalações novas. Ele marca com fundo vermelho mensagens apagadas que o cliente já recebeu e mostra edições. Seu registro é temporário: não recupera mensagens anteriores, nunca carregadas ou de outros dispositivos. Uma preferência anterior do usuário não é sobrescrita.

A seção recomendada é uma seleção editorial, não um ranking de uso medido. A lista inclui MessageLogger, ShowHiddenChannels, FakeNitro, SpotifyControls, BetterGifPicker, BetterFolders, ClearURLs, Translate, FavoriteEmojiFirst, SilentMessageToggle, ReadAllNotificationsButton e VolumeBooster.

**ShowHiddenChannels** é opcional. Quando ativo, mostra na lista os canais ocultos cujos dados o Discord entregar ao aplicativo. Clicar abre uma prévia local, com metadados disponíveis e sem mensagens, campo de conversa ou entrada em voz. Canais que o servidor não enviar continuam invisíveis. Não concede permissões do servidor.

O **SpotifyControls** tem uma bússola acima do player. Ao clicar, abre uma busca compacta com três faixas visíveis e rolagem para carregar mais. A busca usa a conta Spotify conectada ao Discord; o player aparece quando há música e dispositivo ativos. Ao escolher uma faixa, o SeCord tenta reproduzi-la no dispositivo ativo. A reprodução direta pode exigir Spotify Premium; se falhar, a faixa abre no Spotify. Não foi possível testar a busca com uma conta conectada neste ambiente.

## Clipes de áudio

No Windows, abra **Clipes de áudio** nas configurações, no menu da bandeja ou com `Ctrl+Alt+C`. Clique para iniciar a captura e depois salve os últimos 30, 60 ou 120 segundos em WAV. A função captura o áudio reproduzido pelo computador, não somente a call; não inclui o seu microfone. Nada é salvo até você escolher um arquivo. Avise as outras pessoas antes de gravar. A função foi compilada, mas ainda precisa de um teste real de captura neste computador.

## Recursos e limites

FakeNitro pode enviar emojis e figurinhas como links ou imagens quando o canal permitir; não concede Nitro. Cosméticos locais podem aparecer apenas para você ou para outros usuários da mesma extensão. Captura de tela e sons de outros servidores dependem das permissões do sistema e do Discord. Se alguém aplicar server deaf ou restringir o soundboard, o SeCord não remove essa permissão.

## Compilar

Requer Node.js 22+ e pnpm. Clone o [cliente SeCord](https://github.com/nociferico/SeCord-Client) como `NociCord`, ao lado deste projeto.

```powershell
pnpm install --frozen-lockfile
pnpm package:nocicord
```

O pacote incorpora os arquivos locais do cliente e não os substitui automaticamente pelos da versão original.

## Créditos

Base Vesktop 1.6.8, commit `16e0c3744185424356deaedde3b078aff3dbba19`. Cliente Vencord 1.15.16, commit `383409e6a6ec9008ee8a7496500f1e75f17824d1`. Consulte [LICENSE](LICENSE) ao redistribuir. SeCord não é afiliado ao Discord, Vencord ou Vesktop.
