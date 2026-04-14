// rust_parser/visitor.rs — syn visitor that walks the AST and extracts RustItems.

use std::path::PathBuf;
use syn::visit::Visit;
use quote::ToTokens;

use super::types::{RustItem, RustItemKind, Span, Visibility};

/// Walks a parsed syn file and collects all items.
pub struct ItemVisitor {
    file_path: PathBuf,
    items: Vec<RustItem>,
    module_path: Vec<String>,
}

impl ItemVisitor {
    pub fn new(file_path: PathBuf) -> Self {
        Self {
            file_path,
            items: Vec::new(),
            module_path: Vec::new(),
        }
    }

    pub fn into_items(self) -> Vec<RustItem> {
        self.items
    }

    pub fn visit_file(&mut self, file: &syn::File) {
        // Visit file-level doc comments (`//!`)
        for item in &file.items {
            self.visit_item(item);
        }
    }

    fn qualified_name(&self, name: &str) -> String {
        if self.module_path.is_empty() {
            name.to_string()
        } else {
            format!("{}::{}", self.module_path.join("::"), name)
        }
    }

    fn make_span(span: proc_macro2::Span) -> Span {
        // proc_macro2 only gives us line info in nightly; in stable we get limited info.
        // We use start()/end() which are available in proc-macro2 ≥ 1.0 with span-locations.
        let start = span.start();
        let end = span.end();
        Span {
            start_line: start.line,
            end_line: end.line,
            start_col: start.column,
            end_col: end.column,
        }
    }

    fn extract_docs(attrs: &[syn::Attribute]) -> Option<String> {
        let mut lines: Vec<String> = Vec::new();
        for attr in attrs {
            if attr.path().is_ident("doc") {
                if let syn::Meta::NameValue(nv) = &attr.meta {
                    if let syn::Expr::Lit(expr_lit) = &nv.value {
                        if let syn::Lit::Str(s) = &expr_lit.lit {
                            // Strip leading space that rustfmt adds after `///`
                            let content = s.value();
                            let trimmed = content.strip_prefix(' ').unwrap_or(&content);
                            lines.push(trimmed.to_string());
                        }
                    }
                }
            }
        }
        if lines.is_empty() {
            None
        } else {
            Some(lines.join("\n"))
        }
    }

    fn convert_visibility(vis: &syn::Visibility) -> Visibility {
        match vis {
            syn::Visibility::Public(_) => Visibility::Public,
            syn::Visibility::Restricted(r) => {
                let path_str = r.path.to_token_stream().to_string();
                if path_str == "crate" {
                    Visibility::PublicCrate
                } else if path_str == "super" {
                    Visibility::PublicSuper
                } else {
                    Visibility::Public
                }
            }
            syn::Visibility::Inherited => Visibility::Private,
        }
    }

    fn generics_str(generics: &syn::Generics) -> Option<String> {
        if generics.params.is_empty() {
            None
        } else {
            Some(generics.to_token_stream().to_string())
        }
    }

    fn fn_signature(func: &syn::ItemFn) -> String {
        let inputs: Vec<String> = func
            .sig
            .inputs
            .iter()
            .map(|a| a.to_token_stream().to_string())
            .collect();
        let output = match &func.sig.output {
            syn::ReturnType::Default => String::new(),
            syn::ReturnType::Type(_, ty) => format!(" -> {}", ty.to_token_stream()),
        };
        format!("fn {}({}){}", func.sig.ident, inputs.join(", "), output)
    }

    fn method_signature(method: &syn::ImplItemFn) -> String {
        let inputs: Vec<String> = method
            .sig
            .inputs
            .iter()
            .map(|a| a.to_token_stream().to_string())
            .collect();
        let output = match &method.sig.output {
            syn::ReturnType::Default => String::new(),
            syn::ReturnType::Type(_, ty) => format!(" -> {}", ty.to_token_stream()),
        };
        format!("fn {}({}){}", method.sig.ident, inputs.join(", "), output)
    }
}

impl<'ast> Visit<'ast> for ItemVisitor {
    fn visit_item_struct(&mut self, node: &'ast syn::ItemStruct) {
        let name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name: name.clone(),
            kind: RustItemKind::Struct,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: Self::generics_str(&node.generics),
            signature: None,
            module_path: self.module_path.clone(),
        });
        syn::visit::visit_item_struct(self, node);
    }

    fn visit_item_enum(&mut self, node: &'ast syn::ItemEnum) {
        let name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name: name.clone(),
            kind: RustItemKind::Enum,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: Self::generics_str(&node.generics),
            signature: None,
            module_path: self.module_path.clone(),
        });
        syn::visit::visit_item_enum(self, node);
    }

    fn visit_item_trait(&mut self, node: &'ast syn::ItemTrait) {
        let name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name: name.clone(),
            kind: RustItemKind::Trait,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: Self::generics_str(&node.generics),
            signature: None,
            module_path: self.module_path.clone(),
        });
        syn::visit::visit_item_trait(self, node);
    }

    fn visit_item_fn(&mut self, node: &'ast syn::ItemFn) {
        let name = node.sig.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name: name.clone(),
            kind: RustItemKind::Function,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.sig.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: Self::generics_str(&node.sig.generics),
            signature: Some(Self::fn_signature(node)),
            module_path: self.module_path.clone(),
        });
        syn::visit::visit_item_fn(self, node);
    }

    fn visit_item_impl(&mut self, node: &'ast syn::ItemImpl) {
        let self_ty = node.self_ty.to_token_stream().to_string();
        let trait_name = node
            .trait_
            .as_ref()
            .map(|(_, path, _)| path.to_token_stream().to_string());
        let name = match &trait_name {
            Some(tr) => format!("{} for {}", tr, self_ty),
            None => format!("impl {}", self_ty),
        };

        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name: name.clone(),
            kind: RustItemKind::ImplBlock,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.self_ty.to_token_stream().into_iter().next()
                .map(|t| t.span())
                .unwrap_or_else(proc_macro2::Span::call_site)),
            impl_for: Some(self_ty.clone()),
            impl_trait: trait_name.clone(),
            visibility: Visibility::Private, // impl blocks have no visibility keyword
            generics: Self::generics_str(&node.generics),
            signature: None,
            module_path: self.module_path.clone(),
        });

        // Push impl context so methods get qualified correctly
        let old_len = self.module_path.len();
        self.module_path.push(self_ty.replace(' ', ""));

        // Extract methods within the impl block
        for item in &node.items {
            if let syn::ImplItem::Fn(method) = item {
                let method_name = method.sig.ident.to_string();
                self.items.push(RustItem {
                    qualified_path: self.qualified_name(&method_name),
                    name: method_name.clone(),
                    kind: RustItemKind::Method,
                    docs: Self::extract_docs(&method.attrs),
                    file_path: self.file_path.clone(),
                    span: Self::make_span(method.sig.ident.span()),
                    impl_for: Some(self.module_path.last().cloned().unwrap_or_default()),
                    impl_trait: trait_name.clone(),
                    visibility: Self::convert_visibility(&method.vis),
                    generics: Self::generics_str(&method.sig.generics),
                    signature: Some(Self::method_signature(method)),
                    module_path: self.module_path.clone(),
                });
            }
        }

        self.module_path.truncate(old_len);
        // Don't recurse with visit_item_impl to avoid double-counting methods.
    }

    fn visit_item_mod(&mut self, node: &'ast syn::ItemMod) {
        let mod_name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&mod_name),
            name: mod_name.clone(),
            kind: RustItemKind::Module,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: None,
            signature: None,
            module_path: self.module_path.clone(),
        });

        // Recurse into inline module bodies.
        if node.content.is_some() {
            self.module_path.push(mod_name);
            syn::visit::visit_item_mod(self, node);
            self.module_path.pop();
        }
    }

    fn visit_item_type(&mut self, node: &'ast syn::ItemType) {
        let name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name,
            kind: RustItemKind::TypeAlias,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: Self::generics_str(&node.generics),
            signature: None,
            module_path: self.module_path.clone(),
        });
    }

    fn visit_item_const(&mut self, node: &'ast syn::ItemConst) {
        let name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name,
            kind: RustItemKind::Constant,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: None,
            signature: None,
            module_path: self.module_path.clone(),
        });
    }

    fn visit_item_static(&mut self, node: &'ast syn::ItemStatic) {
        let name = node.ident.to_string();
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name,
            kind: RustItemKind::Static,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.ident.span()),
            impl_for: None,
            impl_trait: None,
            visibility: Self::convert_visibility(&node.vis),
            generics: None,
            signature: None,
            module_path: self.module_path.clone(),
        });
    }

    fn visit_item_macro(&mut self, node: &'ast syn::ItemMacro) {
        let name = node
            .ident
            .as_ref()
            .map(|i| i.to_string())
            .unwrap_or_else(|| "<macro>".to_string());
        self.items.push(RustItem {
            qualified_path: self.qualified_name(&name),
            name,
            kind: RustItemKind::Macro,
            docs: Self::extract_docs(&node.attrs),
            file_path: self.file_path.clone(),
            span: Self::make_span(node.mac.path.to_token_stream()
                .into_iter().next()
                .map(|t| t.span())
                .unwrap_or_else(proc_macro2::Span::call_site)),
            impl_for: None,
            impl_trait: None,
            visibility: Visibility::Private,
            generics: None,
            signature: None,
            module_path: self.module_path.clone(),
        });
    }
}
