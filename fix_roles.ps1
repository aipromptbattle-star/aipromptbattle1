
$content = Get-Content src\app\team\page.tsx -Raw
$content = $content -replace "memberRole, setMemberRole,", ""
$content = $content -replace "memberRole=\{memberRole\}", ""
$content = $content -replace "onSwitchRole=\{\(\) => setRoleModalOpen\(true\)\}", ""
$content = $content -replace "const \[roleModalOpen, setRoleModalOpen\] = useState\(false\);", ""
$content = $content -replace "isMyRole=\{memberRole === `"member1`"\}", "isMyRole={true}"
$content = $content -replace "isMyRole=\{memberRole === `"member2`"\}", "isMyRole={true}"
$content = $content -replace "submittedBy=\{memberRole \|\| `"member1`"\}", "submittedBy={`"member1`"}"
$content = $content.Replace("}), memberRole);", "}), `"member1`");")

# Also remove MemberRoleSelector import
$content = $content.Replace("import { MemberRoleSelector } from `"@/components/apb/MemberRoleSelector`";`n", "")

Set-Content src\app\team\page.tsx $content

