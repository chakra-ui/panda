export function MarkdownSample() {
  return (
    <>
      <p className="lead">
        Until now, styling an article, document, or blog post in a utility-first system meant
        reinventing typography every time. <code>@pandacss/preset-typography</code> gives you a{' '}
        <code>prose</code> recipe for Markdown and CMS HTML you don’t control.
      </p>
      <p>
        Application UIs often strip user-agent styles on purpose. That’s great for dashboards — and
        surprising when the same reset lands on a long-form post. You want the content to look
        polished, not like an unstyled dump from a rich-text editor.
      </p>
      <p>People ask things like:</p>
      <blockquote>
        <p>
          Why did my <code>h1</code> lose its default styles? How do I get sensible article
          typography without fighting the reset?
        </p>
      </blockquote>
      <p>
        Slap <code>prose</code> on a container and you get readable defaults for paragraphs,
        headings, lists, quotes, code, tables, and more — sized with <code>sm</code> through{' '}
        <code>2xl</code>, themed through semantic tokens.
      </p>
      <pre>
        <code>{`<article className={prose({ size: 'lg' })}>
  <h1>…</h1>
  <p>…</p>
</article>`}</code>
      </pre>
      <p>
        For setup details, see the{' '}
        <a href="https://github.com/chakra-ui/panda/tree/v2/packages/preset-typography">
          package README
        </a>
        .
      </p>
      <hr />
      <h2>What to expect from here on out</h2>
      <p>
        What follows is nonsense written to dogfood the recipe. It includes{' '}
        <strong>bold text</strong>, unordered lists, ordered lists, code blocks, block quotes,{' '}
        <em>and even italics</em>.
      </p>
      <p>It’s important to cover these cases for a few reasons:</p>
      <ol>
        <li>We want everything to look good out of the box.</li>
        <li>Really just the first reason — that’s the whole point.</li>
        <li>A list with three items looks more realistic than a list with two.</li>
      </ol>
      <h3>Typography should be easy</h3>
      <p>So that’s a heading for you — with any luck it looks pretty reasonable.</p>
      <p>Something a wise person once said about typography:</p>
      <blockquote>
        <p>
          Typography is pretty important if you don’t want your stuff to look like trash. Make it
          good then it won’t be bad.
        </p>
      </blockquote>
      <p>Images and figures should look okay by default as well:</p>
      <figure>
        <img
          src="https://picsum.photos/seed/panda-prose/1200/640"
          alt="Abstract photograph used as a figure sample"
          width={1200}
          height={640}
        />
        <figcaption>
          Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece
          of classical Latin literature from 45 BC.
        </figcaption>
      </figure>
      <p>Here’s an unordered list to make sure that looks good, too:</p>
      <ul>
        <li>So here is the first item in this list.</li>
        <li>In this example we’re keeping the items short.</li>
        <li>Later, we’ll use longer, more complex list items.</li>
      </ul>
      <h2>What if we stack headings?</h2>
      <h3>We should make sure that looks good, too.</h3>
      <p>
        Sometimes you have headings directly underneath each other. In those cases the spacing
        between the two headings should feel tighter than a paragraph followed by a heading.
      </p>
      <h3>When a heading comes after a paragraph…</h3>
      <p>
        When a heading comes after a paragraph, we need a bit more space. Now let’s see what a more
        complex list would look like.
      </p>
      <ul>
        <li>
          <strong>I often do this thing where list items have headings.</strong>
          <p>
            For some reason I think this looks cool which is unfortunate because it’s pretty
            annoying to get the styles right.
          </p>
          <p>
            I often have two or three paragraphs in these list items, too, so the hard part is
            getting the spacing between the paragraphs, list item heading, and separate list items
            to all make sense.
          </p>
        </li>
        <li>
          <strong>Since this is a list, I need at least two items.</strong>
          <p>
            I explained what I’m doing already in the previous list item, but a list wouldn’t be a
            list if it only had one item.
          </p>
        </li>
        <li>
          <strong>It’s not a bad idea to add a third item either.</strong>
          <p>
            I think it probably would’ve been fine to just use two items but three is definitely not
            worse.
          </p>
        </li>
      </ul>
      <h2>Code should look okay by default</h2>
      <p>
        Most people will use a highlighter if they want fancy blocks, but it shouldn’t hurt to make
        them look <em>okay</em> out of the box.
      </p>
      <p>Here’s a tiny config snippet:</p>
      <pre>
        <code>{`import typographyPreset from '@pandacss/preset-typography'

export default defineConfig({
  presets: [typographyPreset(), '@pandacss/preset-panda'],
})`}</code>
      </pre>
      <h3>What about nested lists?</h3>
      <p>
        Nested lists basically always look bad, but since some of you goofballs are going to do it
        anyway, we have to carry the burden of at least making it work.
      </p>
      <ol>
        <li>
          <strong>Nested lists are rarely a good idea.</strong>
          <ul>
            <li>You might feel organized, but you’re creating a shape that’s hard to read.</li>
            <li>Nested navigation in UIs is a bad idea too — keep things flat.</li>
            <li>Nesting tons of folders in your source code is also not helpful.</li>
          </ul>
        </li>
        <li>
          <strong>Since we need more items, here’s another one.</strong>
          <ul>
            <li>I’m not sure if we’ll bother styling more than two levels deep.</li>
            <li>Two is already too much; three is guaranteed to be a bad idea.</li>
          </ul>
        </li>
        <li>
          <strong>Two items isn’t really a list; three is good though.</strong>
          <ul>
            <li>Please don’t nest lists if you want people to actually read your content.</li>
            <li>Nobody wants to look at this.</li>
          </ul>
        </li>
      </ol>
      <h2>There are other elements we need to style</h2>
      <p>
        I almost forgot links, like{' '}
        <a href="https://panda-css.com" target="_blank" rel="noreferrer">
          this link to the Panda CSS website
        </a>
        . We also need tables:
      </p>
      <table>
        <thead>
          <tr>
            <th>Wrestler</th>
            <th>Origin</th>
            <th>Finisher</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Bret “The Hitman” Hart</td>
            <td>Calgary, AB</td>
            <td>Sharpshooter</td>
          </tr>
          <tr>
            <td>Stone Cold Steve Austin</td>
            <td>Austin, TX</td>
            <td>Stone Cold Stunner</td>
          </tr>
          <tr>
            <td>Randy Savage</td>
            <td>Sarasota, FL</td>
            <td>Elbow Drop</td>
          </tr>
          <tr>
            <td>Vader</td>
            <td>Boulder, CO</td>
            <td>Vader Bomb</td>
          </tr>
          <tr>
            <td>Razor Ramon</td>
            <td>Chuluota, FL</td>
            <td>Razor’s Edge</td>
          </tr>
        </tbody>
      </table>
      <p>
        Inline code should look good too, like if I wanted to talk about <code>&lt;span&gt;</code>{' '}
        elements or tell you the good news about <code>@pandacss/preset-typography</code>.
      </p>
      <h3>
        Sometimes I even use <code>code</code> in headings
      </h3>
      <p>
        Even though it’s probably a bad idea. This “wrap the code blocks in backticks” trick works
        pretty well though.
      </p>
      <p>
        Another thing: a <code>code</code> tag inside a link, like the{' '}
        <a href="https://github.com/chakra-ui/panda" target="_blank" rel="noreferrer">
          <code>chakra-ui/panda</code>
        </a>{' '}
        repository.
      </p>
      <h4>
        We haven’t used an <code>h4</code> yet
      </h4>
      <p>
        But now we have. Please don’t use <code>h5</code> or <code>h6</code> in your content —
        Medium only supports two heading levels for a reason.
      </p>
      <h3>We still need to think about stacked headings though.</h3>
      <h4>Let’s make sure we don’t screw that up with h4 elements, either.</h4>
      <p>
        Phew — with any luck the headings above look pretty good. Let’s end with a decently sized
        block of text so things don’t feel weirdly unbalanced.
      </p>
      <p>
        Please press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd> if you need a hard refresh
        while tweaking styles.
      </p>
      <p>
        Here’s a <span className="not-prose">not-prose island</span> that should skip the recipe
        styles when <code>notProse</code> is enabled.
      </p>
    </>
  )
}
