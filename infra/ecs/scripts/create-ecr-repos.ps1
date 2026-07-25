param(
  [string]$Region = "ap-south-1",
  [string]$Repositories = "catalog-service,order-service,gateway,frontend"
)

$repoList = $Repositories.Split(",")
foreach ($repo in $repoList) {
  $trimmed = $repo.Trim()
  if (-not $trimmed) { continue }

  Write-Output "Ensuring ECR repository exists: $trimmed"
  aws ecr describe-repositories --repository-names $trimmed --region $Region 2>$null | Out-Null
  if ($LASTEXITCODE -ne 0) {
    aws ecr create-repository --repository-name $trimmed --region $Region | Out-Null
    Write-Output "Created: $trimmed"
  } else {
    Write-Output "Already exists: $trimmed"
  }
}
