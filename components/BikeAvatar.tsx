import { Avatar } from "@radix-ui/themes";

export function BikeAvatar({ emoji }: { emoji: string }) {
  return (
    <Avatar
      size="3"
      radius="full"
      fallback={emoji}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--gray-3)",
      }}
    />
  );
}
