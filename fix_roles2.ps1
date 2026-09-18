
$content = Get-Content src\components\apb\TeamWorkspaceHeader.tsx -Raw
$content = $content -replace "import \{ MemberRole \} from `"@/lib/auth/TeamSessionContext`";`r`n", ""
$content = $content -replace "memberRole: MemberRole \| null;", ""
$content = $content -replace "memberRole,", ""
$content = $content -replace "onSwitchRole: \(\) => void;", ""
$content = $content -replace "onSwitchRole,", ""

# Remove Member Role Badge block
$content = $content -replace "(?s)\{\/\* Member Role Badge \*\/\}.*?<\/div>`r`n          \)\}", ""

Set-Content src\components\apb\TeamWorkspaceHeader.tsx $content

