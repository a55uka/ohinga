use proc_macro::TokenStream;
use quote::quote;
use syn::{parse_macro_input, Data, DeriveInput, Fields, Ident};

/* UNWORKING
 * UNWORKING
 * UNWORKING
*/

// #[proc_macro_derive(RenameFields)]
// pub fn rename_fields_derive(input: TokenStream) -> TokenStream {
//     let input = parse_macro_input!(input as DeriveInput);
//     let name = &input.ident;
//     let generics = &input.generics;
//     let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();
//
//     let fields = match input.data {
//         Data::Struct(data) => match data.fields {
//             Fields::Named(fields) => fields.named,
//             _ => panic!("RenameFields only supports named fields"),
//         },
//         _ => panic!("RenameFields only supports structs"),
//     };
//
//     let to_alphabetic_index = |index: usize| {
//         let mut result = String::new();
//         let mut idx = index;
//         loop {
//             result.insert(0, (b'a' + (idx % 26) as u8) as char);
//             idx = idx / 26;
//             if idx == 0 {
//                 break;
//             }
//             idx -= 1;
//         }
//         result
//     };
//
//     // Generate helper struct name
//     let helper_name = Ident::new(&format!("{}RenameFieldsHelper", name), name.span());
//
//     // Generate fields for the helper struct with serde(rename)
//     let helper_fields = fields.iter().enumerate().map(|(i, field)| {
//         let field_name = field.ident.as_ref().unwrap();
//         let field_type = &field.ty;
//         let rename = format!("ONEMILLION{}", to_alphabetic_index(i).to_uppercase());
//         quote! {
//             #[serde(rename = #rename)]
//             #field_name: #field_type
//         }
//     });
//
//     // Generate field assignments for serialization (original to helper)
//     let to_helper_fields = fields.iter().map(|field| {
//         let field_name = field.ident.as_ref().unwrap();
//         quote! { #field_name: self.#field_name.clone() }
//     });
//
//     // Generate field assignments for deserialization (helper to original)
//     let from_helper_fields = fields.iter().map(|field| {
//         let field_name = field.ident.as_ref().unwrap();
//         quote! { #field_name: helper.#field_name.clone() }
//     });
//
//     // Add Clone bound for all field types
//     let field_types: Vec<_> = fields.iter().map(|field| &field.ty).collect();
//     let where_clause_with_clone = quote! {
//         #where_clause
//         #(#field_types: Clone),*
//     };
//
//     let output = quote! {
//         // Define helper struct for serialization
//         #[derive(serde::Serialize, serde::Deserialize)]
//         struct #helper_name #generics #where_clause_with_clone {
//             #(#helper_fields),*
//         }
//
//         // Implement Serialize for the original struct
//         impl #impl_generics serde::Serialize for #name #ty_generics #where_clause_with_clone {
//             fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
//             where
//                 S: serde::Serializer,
//             {
//                 let helper = #helper_name {
//                     #(#to_helper_fields),*
//                 };
//                 helper.serialize(serializer)
//             }
//         }
//
//         // Implement Deserialize for the original struct
//         impl<'de> #impl_generics serde::Deserialize<'de> for #name #ty_generics #where_clause_with_clone {
//             fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
//             where
//                 D: serde::Deserializer<'de>,
//             {
//                 let helper = #helper_name::deserialize(deserializer)?;
//                 Ok(#name {
//                     #(#from_helper_fields),*
//                 })
//             }
//         }
//     };
//
//     TokenStream::from(output)
// }

/* END UNWORKING
 * END UNWORKING
 * END UNWORKING
*/

#[proc_macro_attribute]
pub fn rename_fields(_attr: TokenStream, item: TokenStream) -> TokenStream {
    let input = parse_macro_input!(item as DeriveInput);
    let name = &input.ident;
    let generics = &input.generics;
    let (impl_generics, ty_generics, where_clause) = generics.split_for_impl();

    let fields = match input.data {
        Data::Struct(data) => match data.fields {
            Fields::Named(fields) => fields.named,
            _ => panic!("rename_fields only supports named fields"),
        },
        _ => panic!("rename_fields only supports structs"),
    };

    let to_alphabetic_index = |index: usize| {
        let mut result = String::new();
        let mut idx = index;
        loop {
            result.insert(0, (b'a' + (idx % 26) as u8) as char);
            idx = idx / 26;
            if idx == 0 {
                break;
            }
            idx -= 1;
        }
        result
    };

    let modified_fields = fields.iter().enumerate().map(|(i, field)| {
        let field_name = field.ident.as_ref().unwrap();
        let field_type = &field.ty;
        let rename = to_alphabetic_index(i);
        quote! {
            #[serde(rename = #rename)]
            #field_name: #field_type
        }
    });

    let output = quote! {
        #[derive(serde::Serialize, serde::Deserialize)]
        struct #name #generics #where_clause {
            #(#modified_fields),*
        }
    };

    TokenStream::from(output)
}