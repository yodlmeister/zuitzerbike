"use client";

import { userDisplayName } from "@/lib/helpers";
import { sdk } from "@/lib/sdk";
import { Button, Flex, Heading, Separator } from "@radix-ui/themes";
import { isInIframe, UserContext } from "@yodlpay/yapp-sdk";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const isEmbedded = isInIframe();
  const [userContext, setUserContext] = useState<UserContext | null>(null);

  useEffect(() => {
    if (isEmbedded) {
      sdk.getUserContext().then(setUserContext);
    } else {
      setUserContext(null);
    }
  }, [setUserContext, isEmbedded]);

  const displayName = userDisplayName(userContext);

  let UserButton;

  if (isEmbedded) {
    UserButton = <Button variant="outline">{displayName}</Button>;
  } else {
    UserButton = <appkit-button />;
  }

  return (
    <>
      <Flex mb="3" justify="between">
        <Heading size="5" weight="light">
          <Link style={{ textDecoration: "none", color: "inherit" }} href="/">
            ZuitzerBike
          </Link>
        </Heading>
        {UserButton}
      </Flex>
      <Separator mb="3" size="4" />
    </>
  );
}
