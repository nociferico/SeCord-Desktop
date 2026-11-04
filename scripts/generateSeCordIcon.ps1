Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$source = Join-Path $root 'build\secord-logo.png'
$original = [System.Drawing.Bitmap]::FromFile($source)
$canvas = New-Object System.Drawing.Bitmap 256,256
$graphics = [System.Drawing.Graphics]::FromImage($canvas)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.Clear([System.Drawing.Color]::Transparent)
$left=$original.Width; $top=$original.Height; $right=0; $bottom=0
for($y=0;$y -lt $original.Height;$y+=2){ for($x=0;$x -lt $original.Width;$x+=2){ if($original.GetPixel($x,$y).A -gt 12){ if($x -lt $left){$left=$x}; if($y -lt $top){$top=$y}; if($x -gt $right){$right=$x}; if($y -gt $bottom){$bottom=$y} } } }
$sourceRect=New-Object System.Drawing.Rectangle($left,$top,($right-$left+1),($bottom-$top+1))
$scale=[Math]::Min(230/$sourceRect.Width,230/$sourceRect.Height)
$w=[int]($sourceRect.Width*$scale); $h=[int]($sourceRect.Height*$scale)
$destRect=New-Object System.Drawing.Rectangle([int]((256-$w)/2),[int]((256-$h)/2),$w,$h)
$graphics.DrawImage($original,$destRect,$sourceRect,[System.Drawing.GraphicsUnit]::Pixel)
$pngPath=Join-Path $root 'build\secord-icon.png'
$canvas.Save($pngPath,[System.Drawing.Imaging.ImageFormat]::Png)
$png=[System.IO.File]::ReadAllBytes($pngPath)
$stream=New-Object System.IO.MemoryStream
$writer=New-Object System.IO.BinaryWriter($stream)
$writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]1)
$writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0); $writer.Write([byte]0)
$writer.Write([uint16]1); $writer.Write([uint16]32); $writer.Write([uint32]$png.Length); $writer.Write([uint32]22)
$writer.Write($png)
[System.IO.File]::WriteAllBytes((Join-Path $root 'build\secord.ico'),$stream.ToArray())
$tray=New-Object System.Drawing.Bitmap 64,64
$trayGraphics=[System.Drawing.Graphics]::FromImage($tray)
$trayGraphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$trayGraphics.DrawImage($canvas,0,0,64,64)
$tray.Save((Join-Path $root 'static\tray\tray.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$tray.Save((Join-Path $root 'static\tray\trayUnread.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$trayGraphics.Dispose(); $tray.Dispose(); $writer.Dispose(); $stream.Dispose(); $graphics.Dispose(); $canvas.Dispose(); $original.Dispose()
