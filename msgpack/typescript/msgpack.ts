/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and assuka
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

/**
 * MessagePack encoder and decoder in TypeScript https://github.com/msgpack/msgpack/blob/master/spec.md
 */
export class MsgPack {
    static encode(value: any): Uint8Array {
        const buffer: number[] = [];

        function writeByte(byte: number) {
            buffer.push(byte);
        }

        function writeBytes(bytes: Uint8Array) {
            buffer.push(...bytes);
        }

        function encodeValue(val: any) {
            if (val === null) {
                writeByte(0xc0);
            } else if (typeof val === "boolean") {
                writeByte(val ? 0xc3 : 0xc2);
            } else if (typeof val === "number") {
                if (Number.isInteger(val)) {
                    if (val >= 0) {
                        if (val <= 0x7f) {
                            writeByte(val); // positive fixint
                        } else if (val <= 0xff) {
                            writeByte(0xcc); writeByte(val); // uint8
                        } else if (val <= 0xffff) {
                            writeByte(0xcd); writeByte(val >> 8); writeByte(val & 0xff); // uint16
                        } else if (val <= 0xffffffff) {
                            writeByte(0xce);
                            writeByte((val >> 24) & 0xff);
                            writeByte((val >> 16) & 0xff);
                            writeByte((val >> 8) & 0xff);
                            writeByte(val & 0xff); // uint32
                        } else {
                            throw new Error("Number too large for MessagePack");
                        }
                    } else {
                        if (val >= -32) {
                            writeByte(0xe0 | (val + 32)); // negative fixint
                        } else if (val >= -128) {
                            writeByte(0xd0); writeByte(val & 0xff); // int8
                        } else if (val >= -32768) {
                            writeByte(0xd1); writeByte(val >> 8); writeByte(val & 0xff); // int16
                        } else if (val >= -2147483648) {
                            writeByte(0xd2);
                            writeByte((val >> 24) & 0xff);
                            writeByte((val >> 16) & 0xff);
                            writeByte((val >> 8) & 0xff);
                            writeByte(val & 0xff); // int32
                        } else {
                            throw new Error("Number too small for MessagePack");
                        }
                    }
                } else {
                    // Float64
                    writeByte(0xcb);
                    const view = new DataView(new ArrayBuffer(8));
                    view.setFloat64(0, val);
                    writeBytes(new Uint8Array(view.buffer));
                }
            } else if (typeof val === "string") {
                const bytes = new TextEncoder().encode(val);
                if (bytes.length <= 31) {
                    writeByte(0xa0 | bytes.length); // fixstr
                } else if (bytes.length <= 0xffff) {
                    writeByte(0xda);
                    writeByte(bytes.length >> 8);
                    writeByte(bytes.length & 0xff); // str16
                } else if (bytes.length <= 0xffffffff) {
                    writeByte(0xdb);
                    writeByte((bytes.length >> 24) & 0xff);
                    writeByte((bytes.length >> 16) & 0xff);
                    writeByte((bytes.length >> 8) & 0xff);
                    writeByte(bytes.length & 0xff); // str32
                } else {
                    throw new Error("String too long for MessagePack");
                }
                writeBytes(bytes);
            } else if (Array.isArray(val)) {
                if (val.length <= 15) {
                    writeByte(0x90 | val.length); // fixarray
                } else if (val.length <= 0xffff) {
                    writeByte(0xdc);
                    writeByte(val.length >> 8);
                    writeByte(val.length & 0xff); // array16
                } else if (val.length <= 0xffffffff) {
                    writeByte(0xdd);
                    writeByte((val.length >> 24) & 0xff);
                    writeByte((val.length >> 16) & 0xff);
                    writeByte((val.length >> 8) & 0xff);
                    writeByte(val.length & 0xff); // array32
                } else {
                    throw new Error("Array too large for MessagePack");
                }
                for (const item of val) {
                    encodeValue(item);
                }
            } else if (typeof val === "object") {
                const entries = Object.entries(val);
                if (entries.length <= 15) {
                    writeByte(0x80 | entries.length); // fixmap
                } else if (entries.length <= 0xffff) {
                    writeByte(0xde);
                    writeByte(entries.length >> 8);
                    writeByte(entries.length & 0xff); // map16
                } else if (entries.length <= 0xffffffff) {
                    writeByte(0xdf);
                    writeByte((entries.length >> 24) & 0xff);
                    writeByte((entries.length >> 16) & 0xff);
                    writeByte((entries.length >> 8) & 0xff);
                    writeByte(entries.length & 0xff); // map32
                } else {
                    throw new Error("Object too large for MessagePack");
                }
                for (const [key, value] of entries) {
                    encodeValue(key);
                    encodeValue(value);
                }
            } else {
                throw new Error("Unsupported type for MessagePack");
            }
        }

        encodeValue(value);
        return new Uint8Array(buffer);
    }

    static decode(buffer: Uint8Array): any {
        let index = 0;

        function readByte(): number {
            if (index >= buffer.length) throw new Error("Unexpected end of buffer");
            return buffer[index++];
        }

        function readBytes(length: number): Uint8Array {
            if (index + length > buffer.length) throw new Error("Unexpected end of buffer");
            const bytes = buffer.subarray(index, index + length);
            index += length;
            return bytes;
        }

        function decodeValue(): any {
            const byte = readByte();

            // Null
            if (byte === 0xc0) return null;

            // Boolean
            if (byte === 0xc2) return false;
            if (byte === 0xc3) return true;

            // Positive fixint
            if (byte <= 0x7f) return byte;

            // Negative fixint
            if ((byte & 0xe0) === 0xe0) return (byte & 0x1f) - 0x20;

            // Uint
            if (byte === 0xcc) return readByte();
            if (byte === 0xcd) return (readByte() << 8) | readByte();
            if (byte === 0xce) {
                return (readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte();
            }

            // Int
            if (byte === 0xd0) return (readByte() << 24) >> 24;
            if (byte === 0xd1) return ((readByte() << 24) | (readByte() << 16)) >> 16;
            if (byte === 0xd2) {
                return (readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte();
            }

            // Float
            // if (byte === 0xcb) {
            //     const view = new DataView(readBytes(8).buffer);
            //     return view.getFloat64(0);
            // }
            if (byte === 0xcb) {
                const bytes = readBytes(8);
                const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
                return view.getFloat64(0, false);
            }

            // String
            if ((byte & 0xe0) === 0xa0) {
                return new TextDecoder().decode(readBytes(byte & 0x1f));
            }
            if (byte === 0xda) {
                const length = (readByte() << 8) | readByte();
                return new TextDecoder().decode(readBytes(length));
            }
            if (byte === 0xdb) {
                const length = (readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte();
                return new TextDecoder().decode(readBytes(length));
            }

            // Array
            if ((byte & 0xf0) === 0x90) {
                const length = byte & 0x0f;
                const result: any[] = [];
                for (let i = 0; i < length; i++) {
                    result.push(decodeValue());
                }
                return result;
            }
            if (byte === 0xdc) {
                const length = (readByte() << 8) | readByte();
                const result: any[] = [];
                for (let i = 0; i < length; i++) {
                    result.push(decodeValue());
                }
                return result;
            }
            if (byte === 0xdd) {
                const length = (readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte();
                const result: any[] = [];
                for (let i = 0; i < length; i++) {
                    result.push(decodeValue());
                }
                return result;
            }

            // Map
            if ((byte & 0xf0) === 0x80) {
                const length = byte & 0x0f;
                const result: Record<string, any> = {};
                for (let i = 0; i < length; i++) {
                    const key = decodeValue();
                    if (typeof key !== "string") throw new Error("Map keys must be strings");
                    result[key] = decodeValue();
                }
                return result;
            }
            if (byte === 0xde) {
                const length = (readByte() << 8) | readByte();
                const result: Record<string, any> = {};
                for (let i = 0; i < length; i++) {
                    const key = decodeValue();
                    if (typeof key !== "string") throw new Error("Map keys must be strings");
                    result[key] = decodeValue();
                }
                return result;
            }
            if (byte === 0xdf) {
                const length = (readByte() << 24) | (readByte() << 16) | (readByte() << 8) | readByte();
                const result: Record<string, any> = {};
                for (let i = 0; i < length; i++) {
                    const key = decodeValue();
                    if (typeof key !== "string") throw new Error("Map keys must be strings");
                    result[key] = decodeValue();
                }
                return result;
            }

            throw new Error(`Unsupported MessagePack type: 0x${byte.toString(16)}`);
        }

        const result = decodeValue();
        if (index < buffer.length) throw new Error("Extra data in buffer");
        return result;
    }
}

// Example usage:
/*
const data = {
  name: "John",
  age: 30,
  scores: [95, 87, 92],
  active: true,
  details: { id: 123, verified: null }
};

const encoded = MsgPack.encode(data);
console.log(encoded);
const decoded = MsgPack.decode(encoded);
console.log(decoded);
*/
