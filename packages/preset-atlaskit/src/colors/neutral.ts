export const neutralColors = composeColorScheme({
  light: {
    Neutral0: { value: '#FFFFFF' },
    Neutral100: { value: '#F7F8F9' },
    Neutral100A: { value: '#091E4208' },
    Neutral200: { value: '#F1F2F4' },
    Neutral200A: { value: '#091E420F' },
    Neutral300: { value: '#DCDFE4' },
    Neutral300A: { value: '#091E4224' },
    Neutral400: { value: '#B3B9C4' },
    Neutral400A: { value: '#091E424F' },
    Neutral500: { value: '#8590A2' },
    Neutral500A: { value: '#091E427D' },
    Neutral600: { value: '#758195' },
    Neutral700: { value: '#626F86' },
    Neutral800: { value: '#44546F' },
    Neutral900: { value: '#2C3E5D' },
    Neutral1000: { value: '#172B4D' },
    Neutral1100: { value: '#091E42' },
  },
  dark: {
    Neutral0: { value: '#161A1D' },
    Neutral100: { value: '#1D2125' },
    Neutral100A: { value: '#BCD6F00A' },
    Neutral200: { value: '#22272B' },
    Neutral200A: { value: '#A1BDD914' },
    Neutral300: { value: '#2C333A' },
    Neutral300A: { value: '#A6C5E229' },
    Neutral400: { value: '#454F59' },
    Neutral400A: { value: '#BFDBF847' },
    Neutral500: { value: '#596773' },
    Neutral500A: { value: '#9BB4CA80' },
    Neutral600: { value: '#738496' },
    Neutral700: { value: '#8696A7' },
    Neutral800: { value: '#9FADBC' },
    Neutral900: { value: '#B6C2CF' },
    Neutral1000: { value: '#C7D1DB' },
    Neutral1100: { value: '#DEE4EA' },
  },
})

function composeColorScheme(colors: Record<'light' | 'dark', Record<any, any>>) {
  return Object.keys(colors.light).reduce((acc, key) => {
    acc[key] = { _light: colors.light[key], _dark: colors.dark[key] }
    return acc
  }, {} as Record<any, any>)
}
