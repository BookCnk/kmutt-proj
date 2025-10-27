export async function getTemplateBytes(
  template: File | Blob | ArrayBuffer | string
): Promise<ArrayBuffer> {
  if (template instanceof ArrayBuffer) return template;

  if (template instanceof File || template instanceof Blob) {
    // ถ้าพาสจาก <input type="file"> จะโอเค
    return await template.arrayBuffer();
  }

  if (typeof template === "string") {
    // แนะนำวางไฟล์ไว้ใน /public แล้วเรียกแบบ "/templates/xxx.pdf"
    const url = template.startsWith("/") ? template : encodeURI(template);
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      throw new Error(`Fetch template failed: ${res.status} ${res.statusText}`);
    }

    const ct = res.headers.get("content-type") ?? "";
    if (!ct.toLowerCase().includes("pdf")) {
      // ไม่ใช่ PDF — อ่านตัวอย่างข้อความมาดูว่าเป็น HTML 404/redirect ไหม
      const preview = (await res.text()).slice(0, 200);
      console.error(
        "Template is NOT PDF. content-type=",
        ct,
        "preview=",
        preview
      );
      throw new Error("Template URL did not return a PDF (check path /public)");
    }

    return await res.arrayBuffer();
  }

  throw new Error("Unsupported template type");
}
