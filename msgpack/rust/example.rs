use serde::{Deserialize, Serialize};
use rmp_serde::{Deserializer, Serializer};

use CURRENT::rename_fields;

#[derive(Debug)]
#[rename_fields]
struct DataMew {
    purr: String,
    pi: f64,
    ara: (String, u64),
    meow: u64,
    r_u_a_cat: bool,
}

fn main() {
    let raw_data = [133, 161, 97, 166, 112, 117, 114, 114, 114, 114, 161, 98, 203, 64, 9, 33, 251, 84, 82, 69, 80, 161, 99, 146, 164, 116, 101, 115, 116, 10, 161, 100, 206, 0, 15, 66, 64, 161, 101, 195];
    let mut de = Deserializer::new(&raw_data[..]);

    let data: DataMew = Deserialize::deserialize(&mut de).unwrap();
}