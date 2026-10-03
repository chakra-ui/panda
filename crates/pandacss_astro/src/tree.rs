use std::ops::Range;

pub(crate) struct Document {
    pub(crate) frontmatter: Option<crate::frontmatter::Frontmatter>,
    pub(crate) body: Vec<Child>,
    pub(crate) diagnostics: Vec<crate::AstroDiagnostic>,
}

pub(crate) struct Child {
    pub(crate) start: usize,
    pub(crate) kind: ChildKind,
}

pub(crate) enum ChildKind {
    Element(Element),
    Fragment(Fragment),
    Expression(Expression),
    Spread(Expression),
    Other,
}

pub(crate) struct Element {
    pub(crate) name: Range<usize>,
    pub(crate) opening: Range<usize>,
    pub(crate) attributes: Vec<Attribute>,
    pub(crate) children: Vec<Child>,
    pub(crate) script: Option<Range<usize>>,
}

pub(crate) struct Fragment {
    pub(crate) span: Range<usize>,
    pub(crate) children: Vec<Child>,
}

pub(crate) struct Expression {
    pub(crate) span: Range<usize>,
    pub(crate) markup: Vec<Markup>,
}

pub(crate) enum Markup {
    Element {
        span: Range<usize>,
        element: Element,
    },
    Fragment(Fragment),
}

impl Markup {
    pub(crate) fn span(&self) -> Range<usize> {
        match self {
            Markup::Element { span, .. } => span.clone(),
            Markup::Fragment(fragment) => fragment.span.clone(),
        }
    }
}

pub(crate) struct Attribute {
    pub(crate) name: Option<Range<usize>>,
    pub(crate) value: Value,
}

pub(crate) enum Value {
    Boolean,
    Static { span: Range<usize>, quoted: bool },
    Expression(Expression),
    Markup(Markup),
    Spread(Expression),
    Empty,
}
