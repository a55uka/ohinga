import { MsgPack } from "./msgpack";
import { fromLetterKeys, toLetterKeys } from "./utils";

const Data_keys: (keyof Data)[] = ["purr", "pi", "ara", "ONEMILLION", "r_u_a_cat"];
interface Data {
    purr: string;
    pi: number;
    ara: Array<string | number>;
    ONEMILLION: number;
    r_u_a_cat: boolean;
}

const data: Data = {
    purr: "purrrr",
    pi: 3.141592654,
    ara: ["test", 10],
    ONEMILLION: 1000000,
    r_u_a_cat: true
};

const compressed_data = toLetterKeys(data);

const encoded = MsgPack.encode(compressed_data);
console.log("Default: ", encoded.join(", "));

const decoded = MsgPack.decode(encoded);
console.log(decoded);

const restored_data = fromLetterKeys<Data>(compressed_data, Data_keys);
console.log(restored_data);