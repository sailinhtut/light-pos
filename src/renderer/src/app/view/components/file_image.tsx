import { arrayBufferToBase64 } from "@renderer/utils/encrypt_utils";
import { useEffect, useState } from "react";

export function FileImage({
  src,
  className,
  alt
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  const [file, setFile] = useState("");

  useEffect(
    function () {
      loadImage();
    },
    [src]
  );
  const loadImage = async () => {
    const data = await window.electron.ipcRenderer.invoke("loadFile", src);
    setFile(arrayBufferToBase64(data));
  };
  return <img src={`data:image/png;base64,${file}`} alt={alt} className={className} />;
}
