// AAML Legal Submission Template for Typst
// Provides proper page-aware footnotes and professional typography

#let legal-submission(
  title: "Submission",
  date: datetime.today(),
  body
) = {
  // Page setup
  set page(
    paper: "a4",
    margin: (top: 20mm, bottom: 20mm, left: 25mm, right: 25mm),
    header: align(center, text(size: 9pt, gray)[#title]),
    footer: context align(center, text(size: 9pt)[#counter(page).display("1 of 1", both: true)]),
  )

  // Base text settings
  set text(
    font: "Georgia",
    size: 12pt,
    lang: "en",
  )

  set par(
    justify: true,
    leading: 0.65em,
  )

  // Heading styles with hierarchical numbering
  set heading(numbering: (..nums) => {
    let level = nums.pos().len()
    if level == 1 {
      numbering("I.", ..nums)
    } else if level == 2 {
      numbering("A.", nums.pos().last())
    } else if level == 3 {
      numbering("1.", nums.pos().last())
    }
  })

  // H1 styling - Roman numeral at left edge
  show heading.where(level: 1): it => {
    set text(size: 14pt, weight: "bold")
    v(12pt)
    context {
      grid(
        columns: (32pt, 1fr),
        gutter: 8pt,
        align(left)[#counter(heading).display((..nums) => numbering("I.", ..nums))],
        upper(it.body)
      )
    }
    v(4pt)
  }

  // H2 styling - Letter aligned with paragraph body left edge (indented from H1)
  show heading.where(level: 2): it => {
    set text(size: 12pt, weight: "bold")
    v(8pt)
    context {
      grid(
        columns: (40pt, 24pt, 1fr),
        gutter: 0pt,
        [],  // Empty space to indent
        align(left)[#counter(heading).display((..nums) => numbering("A.", nums.pos().last()))],
        it.body
      )
    }
    v(2pt)
  }

  // H3 styling - Indented one step further than H2
  show heading.where(level: 3): it => {
    set text(size: 12pt, weight: "bold")
    v(6pt)
    context {
      grid(
        columns: (64pt, 24pt, 1fr),
        gutter: 0pt,
        [],  // Empty space for double indent
        align(left)[#counter(heading).display((..nums) => numbering("1.", nums.pos().last()))],
        underline(it.body)
      )
    }
    v(2pt)
  }

  // Footnote styling - aligned like paragraphs with justified text
  set footnote.entry(
    separator: line(length: 30%, stroke: 0.5pt),
    clearance: 0.8em,
    gap: 0.5em,
  )

  show footnote.entry: it => {
    // Get footnote number using counter at the footnote's location
    let loc = it.note.location()
    let num = numbering("1", ..counter(footnote).at(loc))
    set text(size: 10pt)
    set par(justify: true, leading: 0.5em)
    // Grid layout: number in 32pt column, 8pt gutter, text in remaining space
    grid(
      columns: (32pt, 1fr),
      gutter: 8pt,
      align(left)[#super[#num]],
      it.note.body
    )
  }

  // Table styling - aligned with paragraph body (40pt from left)
  set table(
    stroke: 0.5pt + black,
    inset: 5pt,
    align: left,
    fill: (x, y) => if y == 0 { luma(240) } else { none },
  )

  show table.cell.where(y: 0): set text(weight: "bold")

  // Wrap tables with left padding to align with paragraph body
  show table: it => {
    pad(left: 40pt)[#it]
  }

  // Blockquote styling - aligned with paragraph body (40pt from left)
  show quote: it => {
    set text(style: "italic")
    pad(left: 40pt, right: 16pt)[
      #block(
        stroke: (left: 2pt + gray),
        inset: (left: 10pt, y: 4pt),
        it.body
      )
    ]
  }

  // List styling - bullets/numbers aligned with paragraph body (40pt from left)
  set list(indent: 40pt, body-indent: 8pt)
  set enum(indent: 40pt, body-indent: 8pt)

  body
}

// Paragraph counter for numbered paragraphs
#let para-counter = counter("paragraph")

// Numbered paragraph function - number aligned with H2 letters, body aligned with H2 text
#let para(content) = {
  para-counter.step()
  context {
    grid(
      columns: (32pt, 1fr),
      gutter: 8pt,
      align(left, text(size: 10pt, fill: luma(85))[#para-counter.display("1.")]),
      content
    )
  }
  v(4pt)
}

// Reference footnote helper
#let ref-fn(content) = footnote[#strong(content)]
