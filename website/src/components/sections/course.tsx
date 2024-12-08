import { css } from '@/styled-system/css'
import { Container, VStack } from '@/styled-system/jsx'
import { flex, stack } from '@/styled-system/patterns'
import { button } from '@/styled-system/recipes'
import Link from 'next/link'
import { useId } from 'react'

const Logo = (props: React.ComponentProps<'svg'>) => {
  return (
    <svg
      width="294"
      height="45"
      viewBox="0 0 294 45"
      fill="currentColor"
      {...props}
    >
      <path d="M55.1946 40.0225H60.7593V30.1801H61.0622C62.0086 32.4893 64.3556 34.0792 67.4976 34.0792C72.3431 34.0792 75.6365 30.5208 75.6365 23.5554C75.6365 16.5521 72.3431 13.0316 67.4976 13.0316C64.3556 13.0316 62.0086 14.5836 61.0622 16.9307H60.7593L60.5701 13.4101H55.1946V40.0225ZM65.4156 29.5744C62.2735 29.5744 60.835 27.1138 60.835 24.5396V22.5711C60.835 19.997 62.2735 17.5363 65.4156 17.5363C68.1411 17.5363 69.9203 19.4291 69.9203 23.5554C69.9203 27.6816 68.1411 29.5744 65.4156 29.5744Z" />
      <path d="M84.8951 34.0413C88.0371 34.0413 90.3842 32.4893 91.3306 30.1422H91.6334V33.7006H97.1982V13.4101H91.8605L91.6334 16.9307H91.3306C90.3842 14.5836 88.0371 13.0316 84.8951 13.0316C80.0496 13.0316 76.7941 16.5521 76.7941 23.5554C76.7941 30.5208 80.0496 34.0413 84.8951 34.0413ZM87.015 29.5365C84.2894 29.5365 82.4724 27.6438 82.4724 23.5554C82.4724 19.4291 84.2894 17.5363 87.015 17.5363C90.1192 17.5363 91.5577 19.9591 91.5577 22.5711V24.5018C91.5577 27.1138 90.1192 29.5365 87.015 29.5365Z" />
      <path d="M100.447 33.7006H106.011V22.4197C106.011 19.8455 107.601 17.5742 110.478 17.5742C113.166 17.5742 114.302 19.2398 114.302 22.6468V33.7006H119.866V21.4355C119.866 15.3407 116.762 13.0316 112.712 13.0316C109.835 13.0316 107.336 14.3943 106.239 17.0821H106.011L105.784 13.4101H100.447V33.7006Z" />
      <path d="M129.814 34.0413C132.956 34.0413 135.304 32.4893 136.25 30.1422H136.553L136.742 33.7006H142.117V6.104H136.553V16.9307H136.25C135.304 14.5836 132.956 13.0316 129.814 13.0316C124.969 13.0316 121.713 16.5521 121.713 23.5554C121.713 30.5208 124.969 34.0413 129.814 34.0413ZM131.934 29.5365C129.209 29.5365 127.392 27.6438 127.392 23.5554C127.392 19.4291 129.209 17.5363 131.934 17.5363C135.039 17.5363 136.477 19.9591 136.477 22.5711V24.5018C136.477 27.1138 135.039 29.5365 131.934 29.5365Z" />
      <path d="M152.256 34.0413C155.398 34.0413 157.745 32.4893 158.691 30.1422H158.994V33.7006H164.559V13.4101H159.221L158.994 16.9307H158.691C157.745 14.5836 155.398 13.0316 152.256 13.0316C147.41 13.0316 144.155 16.5521 144.155 23.5554C144.155 30.5208 147.41 34.0413 152.256 34.0413ZM154.376 29.5365C151.65 29.5365 149.833 27.6438 149.833 23.5554C149.833 19.4291 151.65 17.5363 154.376 17.5363C157.48 17.5363 158.918 19.9591 158.918 22.5711V24.5018C158.918 27.1138 157.48 29.5365 154.376 29.5365Z" />
      <path
        d="M0 5.07817C0 2.27357 2.27357 0 5.07817 0H38.7787C41.5833 0 43.8569 2.27357 43.8569 5.07817V39.2404C43.8569 42.045 41.5833 44.3186 38.7787 44.3186H5.07817C2.27357 44.3186 0 42.045 0 39.2404V5.07817Z"
        fill="#F6E458"
      />
      <path
        d="M28.1052 9.90635C25.6855 9.21129 23.2175 9.11682 20.7023 9.34176C19.2948 9.48802 17.9417 9.76741 16.6365 10.2577C13.8155 11.3174 11.6973 13.1527 10.4342 15.916C9.52872 17.897 9.20147 20.0015 9.16736 22.1607C9.13132 24.4426 9.41727 26.6929 9.87165 28.9239C10.2835 30.9462 10.832 32.9289 11.6153 34.8427C11.6897 35.0245 11.7824 35.086 11.9811 35.0855C14.4586 35.0802 16.936 35.0802 19.4135 35.0802C20.147 35.0802 20.8804 35.0802 21.6139 35.0801C21.67 35.0801 21.7262 35.077 21.7908 35.0734C21.8237 35.0716 21.8589 35.0697 21.8974 35.068C21.8825 35.0326 21.8692 35 21.8567 34.9695C21.8321 34.9095 21.8108 34.8573 21.7869 34.8063C21.6078 34.4231 21.4249 34.0414 21.2421 33.6598C20.8454 32.8319 20.4488 32.0041 20.0901 31.1602C19.0021 28.6006 18.1689 25.9651 17.9146 23.1754C17.8025 21.9445 17.818 20.7207 18.1595 19.5213C18.5499 18.1504 19.3876 17.1825 20.7764 16.7779C22.0517 16.4063 23.3448 16.4088 24.6131 16.8189C25.7451 17.185 26.4832 17.9582 26.7971 19.116C27.0382 20.0051 27.0381 20.9039 26.8557 21.8003C26.7152 22.4904 26.4325 23.1202 25.9236 23.6241C25.0106 24.5278 23.8705 24.7356 22.6471 24.6663C22.4294 24.654 22.2124 24.6301 21.9888 24.6055C21.884 24.594 21.7779 24.5824 21.6695 24.5716C21.6726 24.6063 21.6743 24.6382 21.6759 24.668C21.6791 24.7268 21.6819 24.7778 21.694 24.8265C21.7461 25.036 21.7958 25.2463 21.8455 25.4567C21.9651 25.9633 22.0848 26.47 22.2387 26.9661C22.5409 27.9402 22.8923 28.8909 23.2907 29.8191C26.1303 29.5975 28.7458 28.8916 31.5218 27.2252C31.5635 27.1989 31.6014 27.1751 31.6393 27.1515C32.8317 26.4092 33.7968 25.4462 34.4623 24.2027C35.5401 22.189 35.7502 20.0355 35.43 17.8127C35.0996 15.5188 34.0701 13.5934 32.298 12.083C31.069 11.0355 29.6477 10.3494 28.1052 9.90635Z"
        fill="black"
      />
      <rect
        x="174.084"
        y="8.91437"
        width="118.867"
        height="28.239"
        rx="5.9451"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="2.09827"
      />
      <path d="M185.207 31.7402H182.311V16.5417H185.007V19.0653C185.523 18.1859 186.182 17.4976 186.985 17.0006C187.788 16.5035 188.715 16.255 189.767 16.255C190.876 16.255 191.832 16.5322 192.635 17.0866C193.457 17.6219 194.04 18.3961 194.384 19.4094C194.919 18.4344 195.617 17.6697 196.477 17.1153C197.337 16.5417 198.351 16.255 199.517 16.255C201.085 16.255 202.327 16.752 203.245 17.7462C204.182 18.7211 204.65 20.1072 204.65 21.9042V31.7402H201.754V22.8219C201.754 21.541 201.476 20.5564 200.922 19.8682C200.368 19.1609 199.565 18.8072 198.513 18.8072C197.863 18.8072 197.261 18.9888 196.707 19.352C196.171 19.6961 195.741 20.1836 195.416 20.8145C195.091 21.4454 194.929 22.1814 194.929 23.0226V31.7402H192.032V22.8219C192.032 21.541 191.755 20.5564 191.201 19.8682C190.665 19.1609 189.862 18.8072 188.792 18.8072C188.123 18.8072 187.511 18.9888 186.957 19.352C186.421 19.6961 185.991 20.1836 185.666 20.8145C185.36 21.4454 185.207 22.1814 185.207 23.0226V31.7402Z" />
      <path d="M217.298 31.7402V29.3888C216.82 30.2299 216.17 30.8799 215.348 31.3388C214.526 31.7976 213.551 32.027 212.423 32.027C210.855 32.027 209.594 31.616 208.638 30.7939C207.682 29.9527 207.204 28.8344 207.204 27.4388C207.204 25.9476 207.787 24.8197 208.953 24.055C210.138 23.2903 211.859 22.9079 214.115 22.9079C214.555 22.9079 214.985 22.9175 215.405 22.9366C215.826 22.9557 216.342 23.0035 216.954 23.08V21.9616C216.954 20.891 216.677 20.0594 216.122 19.4667C215.568 18.855 214.784 18.5491 213.771 18.5491C212.719 18.5491 211.878 18.855 211.247 19.4667C210.636 20.0594 210.311 20.8814 210.272 21.9329H207.634C207.672 20.7858 207.95 19.7917 208.466 18.9506C209.001 18.0903 209.718 17.4307 210.616 16.9719C211.534 16.4939 212.586 16.255 213.771 16.255C215.644 16.255 217.097 16.7616 218.13 17.7748C219.181 18.7689 219.707 20.1741 219.707 21.9903V31.7402H217.298ZM209.957 27.3527C209.957 28.1366 210.234 28.7674 210.788 29.2454C211.343 29.7233 212.079 29.9623 212.997 29.9623C214.22 29.9623 215.186 29.6182 215.893 28.9299C216.6 28.2226 216.954 27.2858 216.954 26.1197V24.8866C216.399 24.8292 215.912 24.791 215.491 24.7719C215.071 24.7336 214.669 24.7145 214.287 24.7145C212.834 24.7145 211.744 24.9344 211.018 25.3741C210.311 25.7947 209.957 26.4542 209.957 27.3527Z" />
      <path d="M235.193 27.2094C235.193 28.7005 234.639 29.8763 233.53 30.7366C232.421 31.5968 230.854 32.027 228.827 32.027C226.839 32.027 225.262 31.5586 224.095 30.6218C222.948 29.6851 222.298 28.4042 222.145 26.7792H224.927C224.965 27.7351 225.338 28.4902 226.045 29.0446C226.772 29.5799 227.718 29.8476 228.884 29.8476C229.898 29.8476 230.71 29.666 231.322 29.3027C231.953 28.9395 232.268 28.4042 232.268 27.6969C232.268 27.066 232.058 26.588 231.637 26.263C231.236 25.938 230.557 25.6895 229.601 25.5174L227.135 25.0586C225.74 24.791 224.659 24.3035 223.895 23.5961C223.13 22.8697 222.748 21.9329 222.748 20.7858C222.748 19.8873 222.987 19.1035 223.465 18.4344C223.962 17.7462 224.65 17.2109 225.529 16.8285C226.409 16.4462 227.431 16.255 228.598 16.255C229.821 16.255 230.892 16.4653 231.809 16.8859C232.727 17.2873 233.463 17.8704 234.017 18.6351C234.572 19.3807 234.887 20.2792 234.964 21.3307H232.182C232.087 20.4322 231.723 19.7248 231.092 19.2086C230.462 18.6925 229.64 18.4344 228.626 18.4344C227.709 18.4344 226.963 18.6256 226.39 19.0079C225.835 19.3711 225.558 19.8778 225.558 20.5278C225.558 21.1395 225.759 21.6079 226.16 21.9329C226.581 22.2388 227.25 22.4873 228.167 22.6785L230.748 23.166C232.259 23.4336 233.377 23.902 234.103 24.5711C234.83 25.2402 235.193 26.1197 235.193 27.2094Z" />
      <path d="M246.304 28.9299V31.4821C245.864 31.6924 245.434 31.8358 245.013 31.9123C244.612 31.9888 244.181 32.027 243.723 32.027C242.786 32.027 241.954 31.8549 241.228 31.5108C240.52 31.1667 239.966 30.6314 239.565 29.9049C239.163 29.1785 238.962 28.2608 238.962 27.152V19.0079H235.607V16.5417H238.962V12.0396H241.859V16.5417H246.447V19.0079H241.859V26.4924C241.859 27.5439 242.088 28.2799 242.547 28.7005C243.025 29.1211 243.646 29.3314 244.411 29.3314C244.755 29.3314 245.08 29.3027 245.386 29.2454C245.711 29.1689 246.017 29.0638 246.304 28.9299Z" />
      <path d="M254.612 32.027C253.14 32.027 251.85 31.702 250.741 31.052C249.651 30.3829 248.801 29.4461 248.189 28.2417C247.577 27.0373 247.271 25.6417 247.271 24.055C247.271 22.5447 247.587 21.2064 248.217 20.0403C248.848 18.8741 249.709 17.9564 250.798 17.2873C251.888 16.5991 253.131 16.255 254.526 16.255C255.673 16.255 256.696 16.4748 257.595 16.9145C258.512 17.3351 259.287 17.9373 259.917 18.7211C260.567 19.4859 261.036 20.3939 261.323 21.4454C261.609 22.4778 261.686 23.6152 261.552 24.8579H248.963V22.9366H258.484C258.426 21.5219 258.034 20.4226 257.308 19.6388C256.6 18.8359 255.654 18.4344 254.469 18.4344C253.609 18.4344 252.853 18.6638 252.203 19.1226C251.573 19.5623 251.076 20.2028 250.712 21.0439C250.368 21.866 250.196 22.8697 250.196 24.055C250.196 25.2402 250.368 26.263 250.712 27.1233C251.056 27.9645 251.553 28.6145 252.203 29.0733C252.853 29.5321 253.637 29.7616 254.555 29.7616C255.645 29.7616 256.543 29.4843 257.25 28.9299C257.977 28.3755 258.455 27.6013 258.684 26.6072H261.552C261.189 28.2895 260.386 29.6182 259.143 30.5932C257.92 31.549 256.409 32.027 254.612 32.027Z" />
      <path d="M267.097 23.9689V31.7402H264.201V16.5417H266.897V19.7535C267.432 18.702 268.225 17.8704 269.277 17.2587C270.347 16.6469 271.504 16.341 272.747 16.341V19.352C271.657 19.2947 270.682 19.4189 269.822 19.7248C268.981 20.0307 268.311 20.5373 267.814 21.2447C267.336 21.9329 267.097 22.841 267.097 23.9689Z" />
      <path d="M287.506 16.5417L279.907 37.2748H276.753L278.932 31.5395L272.939 16.5417H276.064L280.481 28.127L284.581 16.5417H287.506Z" />
    </svg>
  )
}

const BulletIcon = (props: React.ComponentProps<'svg'>) => {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" {...props}>
      <ellipse cx="16.25" cy="17" rx="12.25" ry="12" fill="#F6E458" />
      <path
        d="M31.1667 3.5415L17 16.2915L10.625 11.3332L8.5 13.4582L17 21.9582L33.2917 4.95817L31.1667 3.5415Z"
        fill="black"
      />
      <path
        d="M16.2915 2.62489L16.2936 2.62488C18.9631 2.61379 21.5807 3.36208 23.841 4.78242C23.8874 4.812 23.9203 4.85878 23.9324 4.91253C23.9445 4.96647 23.9347 5.02301 23.9051 5.06971C23.8755 5.11641 23.8286 5.14945 23.7747 5.16157C23.7208 5.17368 23.6642 5.16388 23.6175 5.13431L23.6159 5.13332C21.4218 3.75554 18.8812 3.03007 16.2904 3.04155C13.5301 3.04177 10.8318 3.8604 8.53667 5.39395C6.24123 6.92771 4.45216 9.10771 3.39569 11.6583C2.33921 14.2088 2.06279 17.0154 2.60138 19.723C3.13996 22.4307 4.46936 24.9178 6.42147 26.8699C8.37358 28.822 10.8607 30.1514 13.5684 30.69C16.276 31.2286 19.0826 30.9522 21.6331 29.8957C24.1837 28.8392 26.3637 27.0502 27.8974 24.7547C29.4305 22.4604 30.2491 19.7631 30.2498 17.0038C30.2687 15.7571 30.1056 14.5144 29.7657 13.3148C29.753 13.2633 29.7604 13.2088 29.7865 13.1625C29.8131 13.1153 29.8572 13.0803 29.9092 13.065C29.9612 13.0497 30.0172 13.0553 30.0652 13.0806C30.1113 13.1049 30.1465 13.1456 30.1641 13.1945C30.5161 14.4292 30.6854 15.7088 30.6666 16.9926L30.6665 16.9926L30.6665 16.9993C30.6622 20.8106 29.1462 24.4646 26.4512 27.1596C23.7563 29.8544 20.1026 31.3704 16.2915 31.3749C12.479 31.3749 8.82268 29.8604 6.12684 27.1645C3.43101 24.4687 1.9165 20.8124 1.9165 16.9999C1.9165 13.1874 3.43101 9.53106 6.12684 6.83522C8.82268 4.13939 12.479 2.62488 16.2915 2.62489Z"
        fill="#F6E458"
        stroke="black"
      />
    </svg>
  )
}

const Arc = (props: React.ComponentProps<'svg'>) => {
  const id = useId()
  return (
    <svg width="714" height="263" viewBox="0 0 714 263" fill="none" {...props}>
      <path
        d="M692.993 262.956C656.413 124.094 520.721 19.5066 356.551 19.5066C192.382 19.5066 56.6894 124.094 20.1092 262.956H0C36.9453 112.396 182.554 0 356.551 0C530.548 0 676.157 112.396 713.102 262.956H692.993Z"
        fill={`url(#${id}-paint0_linear_1569_315)`}
        fillOpacity="0.97"
      />
      <path
        d="M56.961 262.956C92.6546 140.831 213.262 50.9814 356.551 50.9814C499.841 50.9814 620.448 140.831 656.141 262.956H635.756C600.601 152.466 489.877 70.488 356.551 70.488C223.225 70.488 112.501 152.466 77.3459 262.956H56.961Z"
        fill={`url(#${id}-paint1_linear_1569_315)`}
        fillOpacity="0.97"
      />
      <defs>
        <linearGradient
          id={`${id}-paint0_linear_1569_315`}
          x1="356.551"
          y1="0"
          x2="356.551"
          y2="262.956"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F4ED97" />
          <stop offset="1" stopColor="#F4ED9A" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id={`${id}-paint1_linear_1569_315`}
          x1="356.551"
          y1="0"
          x2="356.551"
          y2="262.956"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F4ED97" />
          <stop offset="1" stopColor="#F4ED9A" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const ListItem = (props: React.ComponentProps<'li'>) => {
  return (
    <li {...props} className={flex({ gap: '4', align: 'center' })}>
      <BulletIcon />
      <div
        className={css({ flex: '1', textStyle: 'xl', fontWeight: 'medium' })}
      >
        {props.children}
      </div>
    </li>
  )
}

export const SectionCourse = () => {
  return (
    <section
      className={css({
        bg: { base: '#FDFCF0', _dark: '#191919' },
        position: 'relative',
        overflow: 'hidden'
      })}
    >
      <Arc
        className={css({
          position: 'absolute',
          top: '-100px',
          left: '-100px',
          rotate: '135deg',
          hideBelow: 'lg'
        })}
      />
      <Arc
        className={css({
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          rotate: '-135deg',
          hideBelow: 'lg'
        })}
      />
      <Container py="32">
        <VStack>
          <Logo />
          <h2
            className={css({
              mt: '20',
              mb: '2',
              textStyle: '6xl',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: 'tight'
            })}
          >
            The official Panda CSS course
          </h2>
          <p
            className={css({
              textStyle: '2xl',
              fontWeight: 'medium',
              color: 'text.muted'
            })}
          >
            Panda Mastery - Created by the Panda team
          </p>
          <ul className={stack({ gap: '3', my: '8' })}>
            <ListItem>Save time by learning with a practical approach</ListItem>
            <ListItem>Build consistent design systems with confidence</ListItem>
            <ListItem>Learn the technical details behind Panda CSS</ListItem>
          </ul>
          <Link
            href="https://www.pandamastery.com/?ref=course-section"
            style={{ minWidth: '240px' }}
            className={button({
              color: { base: 'black', _dark: 'main' },
              size: 'lg'
            })}
          >
            Watch Now
          </Link>
        </VStack>
      </Container>
    </section>
  )
}
