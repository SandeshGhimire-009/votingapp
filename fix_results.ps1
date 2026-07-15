$file = 'd:\voting-app\client\src\pages\admin\Results.jsx'
$content = Get-Content $file -Raw

$oldStates = "  const [loading, setLoading] = useState(false);"
$newStates = "  const [loading, setLoading] = useState(false);`r`n  const [compareMode, setCompareMode] = useState(false);`r`n  const [compareContest1, setCompareContest1] = useState(null);`r`n  const [compareContest2, setCompareContest2] = useState(null);`r`n  const [selectedContest, setSelectedContest] = useState(null);`r`n`r`n  const results = selectedContest`r`n    ? (() => {`r`n        const candidates = Array.isArray(selectedContest.candidates) ? selectedContest.candidates : [];`r`n        const totalVotes = selectedContest.totalVotes || 0;`r`n        return [...candidates]`r`n          .map(c => ({`r`n            id: c.id,`r`n            name: c.name,`r`n            votes: c.votes || 0,`r`n            percentage: totalVotes > 0 ? ((c.votes || 0) / totalVotes * 100).toFixed(2) : '0.00',`r`n            party: c.party`r`n          }))`r`n          .sort((a, b) => b.votes - a.votes);`r`n      })()`r`n    : [];"

$content = $content.Replace($oldStates, $newStates)
$content = $content.Replace('renderChart(results, selectedContest)', 'renderChart(results)')

[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
Write-Host "Patch applied successfully"
