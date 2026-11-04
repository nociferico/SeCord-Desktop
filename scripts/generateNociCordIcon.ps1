Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$build = Join-Path $root 'build'
$tray = Join-Path $root 'static\tray'
$canvas = New-Object System.Drawing.Bitmap 256,256
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear([System.Drawing.Color]::FromArgb(25,24,32))
$accent = [System.Drawing.Color]::FromArgb(182,107,139)
$light = [System.Drawing.Color]::FromArgb(240,234,240)
$border = New-Object System.Drawing.Pen($accent,8)
$border.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
$g.DrawRectangle($border,21,21,214,214)
$penN = New-Object System.Drawing.Pen($light,14)
$penN.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penN.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawLines($penN,[System.Drawing.Point[]]@((New-Object System.Drawing.Point(63,177)),(New-Object System.Drawing.Point(63,76)),(New-Object System.Drawing.Point(119,177)),(New-Object System.Drawing.Point(119,76))))
$penC = New-Object System.Drawing.Pen($accent,14)
$penC.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$penC.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
$g.DrawArc($penC,126,82,84,94,55,250)
$iconPng = Join-Path $build 'nocicord.png'
$canvas.Save($iconPng,[System.Drawing.Imaging.ImageFormat]::Png)
$png = [System.IO.File]::ReadAllBytes($iconPng)
$ico = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($ico)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
$writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
$writer.Write([uint16]1); $writer.Write([uint16]32); $writer.Write([uint32]$png.Length); $writer.Write([uint32]22)
$writer.Write($png)
[System.IO.File]::WriteAllBytes((Join-Path $build 'nocicord.ico'),$ico.ToArray())
$trayBmp = New-Object System.Drawing.Bitmap 64,64
$trayG = [System.Drawing.Graphics]::FromImage($trayBmp)
$trayG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$trayG.DrawImage($canvas,0,0,64,64)
$trayBmp.Save((Join-Path $tray 'tray.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$trayBmp.Save((Join-Path $tray 'trayUnread.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$trayG.Dispose(); $trayBmp.Dispose(); $writer.Dispose(); $ico.Dispose(); $penN.Dispose(); $penC.Dispose(); $border.Dispose(); $g.Dispose(); $canvas.Dispose()
