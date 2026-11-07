# Run explicitly on a teammate's machine. Does not install packages or change database.
$ErrorActionPreference='Stop'
$projectRoot=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$modelDir=Join-Path $projectRoot '.team/bert-model'
New-Item -ItemType Directory -Path $modelDir -Force | Out-Null
$revision='e8f8c211226b894fcb81acc59f3b34ba3efd5f42'
$baseUrl="https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/resolve/$revision"
$items=@(@{Name='model.onnx';Remote='onnx/model_qint8_avx512.onnx';Hash='783fea82d71a58179b830a4dbd2d58447e640609e98eedf9ffa12622d375a672'},@{Name='tokenizer.json';Remote='tokenizer.json';Hash='2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8'})
foreach($item in $items){
 $target=Join-Path $modelDir $item.Name
 if(Test-Path -LiteralPath $target){if((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Hash){throw 'Existing artifact has wrong hash; inspect it, do not overwrite'};continue}
 $temporary=$target+'.download'
 if(Test-Path -LiteralPath $temporary){throw 'Previous incomplete download exists; inspect before retrying'}
 Invoke-WebRequest -Uri "$baseUrl/$($item.Remote)" -OutFile $temporary -UseBasicParsing
 if((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash.ToLowerInvariant() -ne $item.Hash){throw 'Downloaded artifact hash mismatch; model not enabled'}
 Move-Item -LiteralPath $temporary -Destination $target
}
$manifest=@{model_id='sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2';revision=$revision;format='onnx-int8';source='official sentence-transformers repository';license='Apache-2.0';sha256=@{}}
foreach($item in $items){$manifest.sha256[$item.Name]=$item.Hash}
$manifestPath=Join-Path $modelDir 'manifest.json'
if(!(Test-Path -LiteralPath $manifestPath)){[IO.File]::WriteAllText($manifestPath,($manifest|ConvertTo-Json -Depth 5),(New-Object Text.UTF8Encoding($false)))}
Write-Output 'Model and tokenizer verified. No training performed. Cold load still requires at least 1 GiB available RAM.'
