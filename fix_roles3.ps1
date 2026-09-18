
$content = Get-Content src\components\apb\TeamWorkspaceHeader.tsx -Raw
$content = $content -replace "(?s)\{\/\* Member Role Badge \*\/\}.*?<\/div>`r`n          \)\}`r`n", ""

Set-Content src\components\apb\TeamWorkspaceHeader.tsx $content

