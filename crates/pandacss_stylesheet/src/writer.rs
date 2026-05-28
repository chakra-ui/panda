pub struct CssWriter {
    out: String,
    minify: bool,
    indent: usize,
}

impl CssWriter {
    pub fn new(minify: bool, capacity: usize) -> Self {
        Self {
            out: String::with_capacity(capacity),
            minify,
            indent: 0,
        }
    }

    pub fn finish(self) -> String {
        self.out
    }

    pub fn len(&self) -> usize {
        self.out.len()
    }

    pub fn write_str(&mut self, value: &str) {
        self.out.push_str(value);
    }

    pub fn newline(&mut self) {
        if !self.minify {
            self.out.push('\n');
        }
    }

    pub fn layer(&mut self, name: &str, write: impl FnOnce(&mut Self)) {
        self.write_indent();
        self.out.push_str("@layer ");
        self.out.push_str(name);
        self.block(write);
    }

    pub fn rule(&mut self, selector: &str, write: impl FnOnce(&mut Self)) {
        self.write_indent();
        self.out.push_str(selector);
        self.block(write);
    }

    pub fn at_rule(&mut self, rule: &str, write: impl FnOnce(&mut Self)) {
        self.write_indent();
        self.out.push_str(rule);
        self.block(write);
    }

    fn block(&mut self, write: impl FnOnce(&mut Self)) {
        if !self.minify {
            self.out.push(' ');
        }
        self.out.push('{');
        self.newline();
        self.indent += 1;
        write(self);
        self.indent = self.indent.saturating_sub(1);
        self.write_indent();
        self.out.push('}');
        self.newline();
    }

    pub fn declaration(&mut self, prop: &str, value: &str, important: bool) {
        if value.is_empty() {
            return;
        }
        self.write_indent();
        self.out.push_str(prop);
        self.out.push(':');
        if !self.minify {
            self.out.push(' ');
        }
        self.out.push_str(value);
        if important {
            self.out.push_str(" !important");
        }
        self.out.push(';');
        self.newline();
    }

    fn write_indent(&mut self) {
        if self.minify {
            return;
        }
        for _ in 0..self.indent {
            self.out.push_str("  ");
        }
    }
}
