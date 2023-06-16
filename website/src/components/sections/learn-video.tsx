import { Container, Grid, Stack, panda } from '@/styled-system/jsx'
import { LearnVideoItem } from './learn-video-item'
import lessons from './learn-videos.json' assert { type: 'json' }

export const SectionVideos = () => {
  return (
    <panda.section mt={{ base: '-10', lg: '-20' }}>
      <Container
        pt="10"
        pb="40"
        bg={{ base: 'white', _dark: 'dark' }}
        rounded="lg"
        shadow="lg"
      >
        <Stack gap="32">
          {Object.values(lessons).map(({ title, data }) => (
            <Stack gap={{ base: '8', md: '12' }} key={title}>
              <panda.h3
                textStyle="panda.h3"
                color="text.headline"
                fontWeight="bold"
              >
                {title}
              </panda.h3>
              <Grid
                columns={{ base: 1, sm: 2, md: 3 }}
                gap={{ base: '4', md: '8' }}
              >
                {data.map(video => (
                  <LearnVideoItem
                    key={video.url}
                    title={video.title}
                    duration={video.duration}
                    thumbnail={video.thumbnail}
                    url={video.url}
                  />
                ))}
              </Grid>
            </Stack>
          ))}
        </Stack>
      </Container>
    </panda.section>
  )
}
