export const getFinalPaths = (paths: Set<string>) => {
  paths.forEach((path) => {
    paths.forEach((potentialExtension) => {
      if (potentialExtension.startsWith(path + '.')) {
        paths.delete(path)
      }
    })
  })

  return paths
}
