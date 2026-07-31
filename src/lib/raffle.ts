export function buildWhatsappMessage(
  name: string,
  groupNumber: number,
  numbers: string[],
) {
  return [
    `¡Hola ${name}! 🎉`,
    ``,
    `Gracias por tu compra y por tu apoyo en la rifa.`,
    ``,
    `Tu grupo asignado es el N° ${groupNumber}`,
    `Tus números son: ${numbers.join(" - ")}`,
    ``,
    `Juega el 15 de agosto con la Lotería de Boyacá (dos últimas cifras).`,
    `Premio: licuadora o airfryer (o si prefieres, el efectivo).`,
    ``,
    `¡Mucha suerte! 🍀`,
    `— Malik`,
  ].join("\n");
}

/** Devuelve el link de WhatsApp si el contacto es un número, o null si es un usuario. */
export function buildWhatsappLink(contact: string, message: string) {
  const digits = contact.replace(/[^0-9]/g, "");
  if (digits.length < 7) return null;
  const phone = digits.length === 10 ? `57${digits}` : digits;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}