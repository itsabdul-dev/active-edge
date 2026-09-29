export const deliverySteps = [
  { stage: "paid", label: "Order confirmed", description: "Your payment is confirmed." },
  { stage: "processing", label: "Packing your order", description: "Your kit is being prepared." },
  { stage: "shipped", label: "On its way", description: "Handed to the demo courier." },
  {
    stage: "out_for_delivery",
    label: "Out for delivery",
    description: "Your delivery is on its final leg.",
  },
  { stage: "delivered", label: "Delivered", description: "Your demo delivery is complete." },
] as const;
export function deliveryStage(status: string, events: { stage: string }[]) {
  if (status === "shipped" && events.some((e) => e.stage === "out_for_delivery"))
    return "out_for_delivery";
  return status;
}
