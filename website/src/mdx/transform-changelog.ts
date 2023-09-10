export const transformChangelog = (changelog: string) => {
  const cleanChangelog = changelog
    .replace('# CHANGELOG', '# Changelog')
    .replace(/^.*\.\/\.changeset.*$/gm, '')
    .replace('## [Unreleased]', '')

  const versionAndDateRegex = /\[([\d.]+)\] - (\d{4}-\d{2}-\d{2})/g

  const transformedChangelog = cleanChangelog.replace(
    versionAndDateRegex,
    (_, version, date) => {
      const formattedVersion = `Version ${version}`
      const formattedDate = `${date}`
      return `${formattedVersion} \n${formattedDate}`
    }
  )

  return transformedChangelog
}
