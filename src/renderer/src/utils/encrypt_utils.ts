import pako from "pako";

// export function encodeGzip(json: string): string {
//   const utf8Bytes = new TextEncoder().encode(json);
//   const compressedBytes = pako.gzip(utf8Bytes);
//   const compressedBase64 = btoa(String.fromCharCode.apply(null, compressedBytes));
//   return compressedBase64;
// }
export function encodeGzip(json: string): string {
  const utf8Bytes = new TextEncoder().encode(json);
  const compressedBytes = pako.gzip(utf8Bytes);

  // Convert compressedBytes to a base64 string
  const base64String = arrayBufferToBase64(new Uint8Array(compressedBytes));
  return base64String;
}

export function decodeGzip(zippedData: string): string {
  // Decode base64 to binary string
  const binaryString = atob(zippedData);

  // Convert binary string to Uint8Array
  const compressedBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    compressedBytes[i] = binaryString.charCodeAt(i);
  }

  // Decompress the bytes
  const decompressedBytes = pako.ungzip(compressedBytes);

  // Decode decompressed bytes to string
  const decompressedString = new TextDecoder().decode(decompressedBytes);

  return decompressedString;
}

// export function decodeGzip(zippedData: string): string {
//   const compressedBytes = new Uint8Array(
//     atob(zippedData)
//       .split("")
//       .map((char) => char.charCodeAt(0))
//   );
//   const decompressedBytes = pako.ungzip(compressedBytes);
//   const decompressedString = new TextDecoder().decode(decompressedBytes);
//   return decompressedString;
// }

// export function base64ToArrayBuffer(base64String: string) {
//   const arrayBuffer = new ArrayBuffer(base64String.length);
//   const uint8List = new Uint8Array(arrayBuffer);
//   for (let i = 0; i < base64String.length; i++) {
//     uint8List[i] = base64String.charCodeAt(i);
//   }
//   return arrayBuffer;
// }

export function base64ToArrayBuffer(base64String: string) {
  // Decode the base64 string to get a binary string
  const binaryString = atob(base64String);

  // Create an ArrayBuffer with the same length as the binary string
  const arrayBuffer = new ArrayBuffer(binaryString.length);

  // Create a typed array view (Uint8Array) on the ArrayBuffer
  const uint8List = new Uint8Array(arrayBuffer);

  // Fill the Uint8Array with the binary data
  for (let i = 0; i < binaryString.length; i++) {
    uint8List[i] = binaryString.charCodeAt(i);
  }

  return arrayBuffer;
}

export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  const uint8List = new Uint8Array(arrayBuffer);
  let charString = "";
  for (let i = 0; i < uint8List.length; i++) {
    charString += String.fromCharCode(uint8List[i]);
  }
  return btoa(charString);
}

export function base64ToBlob(base64String: string) {
  const byteString = atob(base64String.split(",")[1]);
  const mimeString = base64String.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uint8List = new Uint8Array(arrayBuffer);
  for (let i = 0; i < byteString.length; i++) {
    uint8List[i] = byteString.charCodeAt(i);
  }
  return new Blob([arrayBuffer], { type: mimeString });
}

export function blobToArrayBuffer(blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
