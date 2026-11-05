# SeCord (SoulEater)

SeCord é um aplicativo Windows separado do Discord original. Usa a base aberta do [Vesktop](https://github.com/Vencord/Vesktop) e incorpora o [cliente SeCord](https://github.com/nociferico/SeCord-Client). Tem executável, ícone e dados próprios. Não modifica os arquivos do Discord instalado.

## Instalar

Baixe o instalador na página [Releases](https://github.com/nociferico/SeCord-Desktop/releases). Nesta versão, o arquivo se chama `SeCord - version 11.exe`. O instalador ainda não tem assinatura digital.

## Desempenho

Numa medição curta com os dois aplicativos na tela Amigos, o SeCord usou cerca de 1,22 GB de memória e o Discord original cerca de 1,02 GB. Por enquanto, o SeCord não está mais leve. Os recursos extras ainda cobram memória.

## Extensões e favoritos

A tela **Extensões** está em português. As descrições e opções comuns foram traduzidas; nomes técnicos das extensões permanecem reconhecíveis. A lista mostra primeiro **Favoritas**, depois **Mais úteis para começar** e, abaixo, as demais. Clique na estrela de um cartão para fixar ou desafixar.

**MessageLogger** vem ativado e favoritado por padrão em instalações novas; uma preferência anterior do usuário não é sobrescrita. Ele marca com fundo vermelho mensagens apagadas que o cliente já recebeu e mostra edições. A opção **Guardar mensagens apagadas**, ativada por padrão, mantém até 500 mensagens por 30 dias neste computador. O registro pode ser consultado e apagado nas opções da extensão após reiniciar o SeCord. As marcas vermelhas dentro da conversa ainda dependem das mensagens carregadas na sessão atual. Ele não recupera mensagens anteriores, nunca carregadas ou de outros dispositivos.

A seção recomendada é uma seleção editorial, não um ranking de uso medido. A lista inclui MessageLogger, ShowHiddenChannels, FakeNitro, SpotifyControls, SpotifySemPausa, BetterGifPicker, BetterFolders, ClearURLs, Translate, FavoriteEmojiFirst, SilentMessageToggle, ReadAllNotificationsButton e VolumeBooster.

**ShowHiddenChannels** é opcional. Quando ativo, mostra na lista os canais ocultos cujos dados o Discord entregar ao aplicativo. Clicar abre uma prévia local, com metadados disponíveis e sem mensagens, campo de conversa ou entrada em voz. Canais que o servidor não enviar continuam invisíveis. Não concede permissões do servidor.

O **SpotifyControls** mostra a música em reprodução e mantém os botões de pausar, continuar, avançar, voltar, repetir e embaralhar. A lupa para escolher faixas foi retirada porque a seleção não funcionou de forma confiável nos testes.

As duas telas de carregamento usam a logo do SeCord com movimento discreto. A animação para quando o aplicativo termina de carregar e respeita a preferência de movimento reduzido do sistema.

## Tradução de mensagens

A extensão **Translate** agora oferece opções separadas para traduzir automaticamente mensagens enviadas e recebidas. A tradução recebida aparece abaixo do texto original. O idioma de origem pode ficar em **detecção automática**, útil quando a conversa mistura idiomas. A tradução depende da disponibilidade do provedor escolhido e é aplicada às mensagens que o SeCord carregar; não altera o texto salvo no Discord.

## Spotify na chamada

Em **Configurações → SeCord → Spotify na chamada**, ative **Evitar pausa do Spotify** e reinicie com `Ctrl+Shift+R`. A opção impede a rotina de pausa do cliente de executar durante a chamada. Ela não controla pausas originadas no aplicativo do Spotify ou em outro dispositivo. O usuário confirmou que, após ativá-la, a música continuou tocando em uma chamada de mais de 30 segundos na beta.8. Outros dispositivos e situações ainda podem se comportar de modo diferente.

## Indicadores de plataforma

A extensão **PlatformIndicators** fica entre as recomendadas e vem ativada e favoritada em instalações novas. Ela mostra ícones de computador, celular, navegador, console/jogo ou realidade virtual na lista de membros, em perfis e nas mensagens quando o Discord fornece o tipo da sessão. Ausência de ícone não prova que a pessoa está offline ou em um dispositivo específico. As opções podem ser desligadas na extensão.

## Clipes de áudio

No Windows, abra **Clipes de áudio** nas configurações, no menu da bandeja ou com `Ctrl+Alt+C`. Clique para iniciar a captura e depois salve os últimos 30, 60 ou 120 segundos em WAV. A função captura o áudio reproduzido pelo computador, não somente a call; não inclui o seu microfone. Nada é salvo até você escolher um arquivo. Avise as outras pessoas antes de gravar. A função foi compilada, mas ainda precisa de um teste real de captura neste computador.

## Transmissão própria do SeCord

Abra **Transmissão SeCord** nas configurações, no menu da bandeja ou com `Ctrl+Alt+S`. Escolha a tela ou janela, 480p/720p/1080p, 30/60 fps e se deseja incluir o áudio do computador. Clique em **Iniciar transmissão** e envie o convite para quem vai assistir. A outra pessoa cola o convite na mesma janela do SeCord. O Discord comum não tem um visualizador para esse convite.

A sala usa um servidor pequeno apenas para apresentar transmissor e espectadores. O vídeo e o áudio são enviados diretamente entre os participantes por WebRTC quando a rede permite. O endereço público `wss://secord-stream-signal-nociferico.onrender.com/signal` já vem preenchido no aplicativo. O plano gratuito pode demorar a acordar após um período sem uso. Até quatro espectadores podem entrar por sala. Para testar sem internet, inicie `pnpm --filter secord-stream-signal start` e use `ws://127.0.0.1:8787/signal` no campo avançado das duas janelas.

Foram testados separadamente a captura real de tela no Electron e o recebimento de vídeo entre duas janelas por WebRTC usando o servidor público. Ainda falta uma prova com duas pessoas em redes diferentes e um teste do áudio transmitido.

Algumas redes exigem um servidor TURN para a mídia passar. Esta versão usa apenas STUN, portanto a conexão remota não é garantida em todas as redes. Qualquer pessoa com o convite e um visualizador compatível pode entrar; o convite não é uma prova de que ela usa uma cópia oficial do SeCord. Não há integração com Go Live, servidor de voz ou permissões do Discord. Avise as pessoas antes de transmitir conteúdo da call.

## Recursos e limites

FakeNitro pode enviar emojis e figurinhas como links ou imagens quando o canal permitir; não concede Nitro. A decoração personalizada testada anteriormente foi removida deste pacote. Captura de tela e sons de outros servidores dependem das permissões do sistema e do Discord. Se alguém aplicar server deaf ou restringir o soundboard, o SeCord não remove essa permissão.

**Go Live no Brasil:** o Discord informa que suspendeu a transmissão de tela e o vídeo em tempo real para usuários no Brasil por determinação da ANPD. A restrição também afeta quem usa o SeCord, pois ele se conecta ao serviço do Discord. Uma atualização do SeCord, qualidade de captura ou permissão local não reativa o Go Live nativo. Consulte o [aviso oficial do Discord](https://support.discord.com/hc/pt-br/articles/42704051358359-Por-que-os-recursos-de-v%C3%ADdeo-est%C3%A3o-indispon%C3%ADveis-no-Brasil-no-momento).

## Compilar

Requer Node.js 22+ e pnpm. Clone o [cliente SeCord](https://github.com/nociferico/SeCord-Client) como `NociCord`, ao lado deste projeto.

```powershell
pnpm install --frozen-lockfile
pnpm package:nocicord
```

O pacote incorpora os arquivos locais do cliente e não os substitui automaticamente pelos da versão original.

## Créditos

Base Vesktop 1.6.8, commit `16e0c3744185424356deaedde3b078aff3dbba19`. Cliente Vencord 1.15.16, commit `383409e6a6ec9008ee8a7496500f1e75f17824d1`. Consulte [LICENSE](LICENSE) ao redistribuir. SeCord não é afiliado ao Discord, Vencord ou Vesktop.
