<#
.SYNOPSIS
    Installs this skill set into Claude Code.

.DESCRIPTION
    Links (or copies) every skill in .\skills into the target .claude\skills directory.
    Junctions are the default so edits here take effect without reinstalling.

.PARAMETER Scope
    user    - install into $HOME\.claude\skills (available in every repo). Default.
    project - install into <Target>\.claude\skills (that repo only).

.PARAMETER Target
    Repo root, required when -Scope project.

.PARAMETER Copy
    Copy the skill folders instead of linking them.

.PARAMETER Force
    Replace existing skills of the same name.

.EXAMPLE
    .\install.ps1
.EXAMPLE
    .\install.ps1 -Scope project -Target C:\src\frontend -Copy
#>
[CmdletBinding()]
param(
    [ValidateSet('user', 'project')]
    [string]$Scope = 'user',
    [string]$Target,
    [switch]$Copy,
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

$sourceRoot = Join-Path $PSScriptRoot 'skills'
if (-not (Test-Path $sourceRoot)) {
    throw "No skills directory found at $sourceRoot"
}

if ($Scope -eq 'project') {
    if (-not $Target) { throw 'Use -Target <repo root> with -Scope project.' }
    if (-not (Test-Path $Target)) { throw "Target does not exist: $Target" }
    $destRoot = Join-Path (Resolve-Path $Target) '.claude\skills'
}
else {
    $destRoot = Join-Path $HOME '.claude\skills'
}

if (-not (Test-Path $destRoot)) {
    New-Item -ItemType Directory -Path $destRoot -Force | Out-Null
    Write-Host "Created $destRoot"
}

$skills = Get-ChildItem -Path $sourceRoot -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'SKILL.md') }

if (-not $skills) { throw "No skills with a SKILL.md found in $sourceRoot" }

# Agent definitions live beside the skills and install into a sibling directory.
$agentSource = Join-Path $PSScriptRoot 'agents'
$agentDest = Join-Path (Split-Path $destRoot -Parent) 'agents'

$installed = 0
$skipped = 0

foreach ($skill in $skills) {
    $dest = Join-Path $destRoot $skill.Name

    if (Test-Path $dest) {
        if (-not $Force) {
            Write-Host "  skip    $($skill.Name) (exists; use -Force to replace)" -ForegroundColor DarkYellow
            $skipped++
            continue
        }
        # Remove-Item on a junction deletes the link, not the target.
        Remove-Item -Path $dest -Recurse -Force -Confirm:$false
    }

    if ($Copy) {
        Copy-Item -Path $skill.FullName -Destination $dest -Recurse -Force
        Write-Host "  copied  $($skill.Name)" -ForegroundColor Green
    }
    else {
        New-Item -ItemType Junction -Path $dest -Target $skill.FullName | Out-Null
        Write-Host "  linked  $($skill.Name)" -ForegroundColor Green
    }
    $installed++
}

# --- agent definitions ------------------------------------------------------
$agentsInstalled = 0
if (Test-Path $agentSource) {
    if (-not (Test-Path $agentDest)) {
        New-Item -ItemType Directory -Path $agentDest -Force | Out-Null
    }
    foreach ($agent in Get-ChildItem -Path $agentSource -Filter '*.md') {
        $dest = Join-Path $agentDest $agent.Name
        if ((Test-Path $dest) -and -not $Force) {
            Write-Host "  skip    $($agent.Name) (exists; use -Force to replace)" -ForegroundColor DarkYellow
            continue
        }
        Copy-Item -Path $agent.FullName -Destination $dest -Force
        Write-Host "  agent   $($agent.Name)" -ForegroundColor Cyan
        $agentsInstalled++
    }
}

Write-Host ''
Write-Host "$installed skills installed, $skipped skipped -> $destRoot"
if ($agentsInstalled -gt 0) { Write-Host "$agentsInstalled agents installed -> $agentDest" }
Write-Host 'Restart Claude Code to load them. Then run /skills-map for the index.'
