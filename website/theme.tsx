import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { MDXProvider } from "@mdx-js/react";

import styles from "./theme.module.sass";
import { css } from "./styled-system/css";

function Layout({ pageOpts, children }) {
  // Front matter of the current page:
  // pageOpts.frontMatter

  // You can build the sidebar based on the structure data from `pageMap`:
  // console.log(pageOpts.pageMap)

  return (
    <>
      <Head>
        <title>{pageOpts.title}</title>
      </Head>
      <div>
        <navbar className={styles.navbar}>
          <h2>This is the navbar</h2>
          {
            // You can also set a NEXT_LOCALE cookie to make it the default redirection target:
            // document.cookie = `NEXT_LOCALE=de; path=/`
          }
          <Link href={"/"} locale="en">
            EN
          </Link>
          {" | "}
          <Link href={"/"} locale="de">
            DE
          </Link>
        </navbar>
        <main className={styles.main}>
          <aside className={styles.sidebar}>
            <h3 className={css({ color: "red.300" })}>Navigation</h3>
            <div>
              <Link href="/">Home</Link>
            </div>
            <div>
              <Link href="/docs/v19/globals">Globals</Link>
            </div>
          </aside>
          <article>
            <MDXProvider
              components={{
                // You can add custom components here for MDX
                h1: (props) => <h1 className={styles.h1} {...props} />,
                pre: ({ filename, ...props }) => {
                  return (
                    <div className={styles.codeblock}>
                      {filename ? (
                        <div className={styles.filename}>{filename}</div>
                      ) : null}
                      <pre {...props} />
                    </div>
                  );
                },
              }}
            >
              {children}
            </MDXProvider>
          </article>
        </main>
        <footer>This is the footer</footer>
      </div>
    </>
  );
}

export default function Theme(props) {
  // These are just initial setup for Nextra themes
  const { route } = useRouter();
  const context = globalThis.__nextra_pageContext__[route];
  if (!context) throw new Error(`No content found for ${route}.`);
  const { pageOpts, Content } = context;

  return (
    <Layout pageOpts={pageOpts}>
      <Content {...props} />
    </Layout>
  );
}
