"use client";

import { JSX, useEffect, useState } from "react";
import {
  Box,
  Flex,
  Grid,
  Heading,
  Table,
  Tabs,
  Text,
  Avatar,
  Spinner,
} from "@radix-ui/themes";
import { PaymentSimple } from "@yodlpay/yapp-sdk";
import { sdk } from "@/lib/sdk";
import { RECIPIENT_ENS_OR_ADDRESS } from "@/lib/constants";
import Link from "next/link";
import truncateEthAddress from "truncate-eth-address";
import { slots } from "@/lib/slots";
import { isValidPayment } from "../page";

type TabType = "recent" | "upcoming" | "past" | "invalid";

export default function HistoryPage() {
  const [payments, setPayments] = useState<PaymentSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("recent");

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        // Fetch a large number of payments to the configured address
        const response = await sdk.getPayments({
          perPage: 200,
          receiver: RECIPIENT_ENS_OR_ADDRESS,
        });

        if ("payments" in response) {
          setPayments(response.payments);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // Get today's date as a string in YYYY-MM-DD format
  const todayStr = new Date().toISOString().split("T")[0];
  console.log("Today's date for comparison:", todayStr);

  // Check if a date string is valid
  const isValidDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  // Check if a payment has a valid date format in memo
  const hasValidDateFormat = (payment: PaymentSimple) => {
    const parts = payment.memo.split("_");
    return parts.length === 2 && isValidDate(parts[0]);
  };

  // Filter payments based on tab
  const getFilteredPayments = (): PaymentSimple[] => {
    if (activeTab === "recent") {
      // Sort by blockTimestamp descending (most recent first)
      // Filter out invalid date payments
      return [...payments]
        .filter(hasValidDateFormat)
        .filter(isValidPayment)
        .sort((a, b) => {
          return (
            new Date(b.blockTimestamp).getTime() -
            new Date(a.blockTimestamp).getTime()
          );
        });
    } else if (activeTab === "upcoming") {
      // Filter for upcoming dates (today or later) and sort chronologically
      return [...payments]
        .filter(hasValidDateFormat)
        .filter((payment) => isValidPayment(payment))
        .filter((payment) => {
          const date = payment.memo.split("_")[0];
          return date >= todayStr;
        })
        .sort((a, b) => {
          // First sort by date
          const dateA = a.memo.split("_")[0];
          const dateB = b.memo.split("_")[0];
          if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }
          // Then sort by slot id
          const slotA = a.memo.split("_")[1];
          const slotB = b.memo.split("_")[1];
          return parseInt(slotA) - parseInt(slotB);
        });
    } else if (activeTab === "past") {
      // Past days: Filter for past dates and sort reverse chronologically
      return [...payments]
        .filter(hasValidDateFormat)
        .filter((payment) => isValidPayment(payment))
        .filter((payment) => {
          const date = payment.memo.split("_")[0];
          return date < todayStr;
        })
        .sort((a, b) => {
          // Sort by date, most recent past day first
          const dateA = a.memo.split("_")[0];
          const dateB = b.memo.split("_")[0];
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA);
          }
          // Then sort by slot id
          const slotA = a.memo.split("_")[1];
          const slotB = b.memo.split("_")[1];
          return parseInt(slotA) - parseInt(slotB);
        });
    } else {
      // Invalid: payments with invalid date format
      return [...payments]
        .filter((payment) => !hasValidDateFormat(payment))
        .filter((payment) => !isValidPayment(payment))
        .sort((a, b) => {
          return (
            new Date(b.blockTimestamp).getTime() -
            new Date(a.blockTimestamp).getTime()
          );
        });
    }
  };

  const filteredPayments = getFilteredPayments();

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  // Get emoji for a slot
  const getSlotEmoji = (slotId: string) => {
    const slot = slots.find((s) => s.id === slotId);
    return slot?.emoji || "🚲";
  };

  // Timestamp formatter
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box>
      <Heading size="5" weight="light" mb="4">
        Payment History
      </Heading>

      <Tabs.Root
        defaultValue="recent"
        onValueChange={(value) => setActiveTab(value as TabType)}
      >
        <Tabs.List>
          <Tabs.Trigger value="recent">Most Recent</Tabs.Trigger>
          <Tabs.Trigger value="upcoming">Upcoming</Tabs.Trigger>
          <Tabs.Trigger value="past">Past</Tabs.Trigger>
          <Tabs.Trigger value="invalid">Invalid</Tabs.Trigger>
        </Tabs.List>

        <Box py="4">
          {loading ? (
            <Flex justify="center" align="center" height="300px">
              <Spinner size="3" />
            </Flex>
          ) : filteredPayments.length === 0 ? (
            <Flex justify="center" align="center" height="100px">
              <Text color="gray">No payments found</Text>
            </Flex>
          ) : (
            <Grid gap="3">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Date/Time</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>
                      Booking Date
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Bike</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Sender</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Amount</Table.ColumnHeaderCell>
                    {activeTab === "invalid" && (
                      <Table.ColumnHeaderCell>Memo</Table.ColumnHeaderCell>
                    )}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {(() => {
                    // Group payments by date for display
                    const rows: JSX.Element[] = [];
                    let lastDate = "";

                    // For invalid tab, don't group
                    if (activeTab === "invalid") {
                      return filteredPayments.map((payment) => {
                        const parts = payment.memo.split("_");
                        const bookingDate = parts[0];
                        const slotId = parts[1] || "N/A";

                        return (
                          <Table.Row key={payment.txHash}>
                            <Table.Cell>
                              <Link
                                href={`/tx?txHash=${payment.txHash}&chainId=${payment.chainId}`}
                                style={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                {formatTimestamp(payment.blockTimestamp)}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>{formatDate(bookingDate)}</Table.Cell>
                            <Table.Cell>
                              <Text>#{slotId || "N/A"}</Text>
                            </Table.Cell>
                            <Table.Cell>
                              {payment.senderEnsPrimaryName ||
                                truncateEthAddress(payment.senderAddress)}
                            </Table.Cell>
                            <Table.Cell>
                              {payment.invoiceAmount} {payment.invoiceCurrency}
                            </Table.Cell>
                            <Table.Cell>
                              <Text
                                size="1"
                                style={{
                                  maxWidth: "200px",
                                  overflowWrap: "break-word",
                                }}
                              >
                                {payment.memo}
                              </Text>
                            </Table.Cell>
                          </Table.Row>
                        );
                      });
                    }

                    // For recent tab, group by transaction date
                    if (activeTab === "recent") {
                      filteredPayments.forEach((payment) => {
                        const txDate = new Date(
                          payment.blockTimestamp,
                        ).toLocaleDateString("en-US");

                        if (txDate !== lastDate) {
                          lastDate = txDate;
                          rows.push(
                            <Table.Row key={`date-${txDate}`}>
                              <Table.Cell
                                colSpan={5}
                                style={{
                                  backgroundColor: "var(--gray-3)",
                                  fontWeight: "bold",
                                  padding: "8px 16px",
                                }}
                              >
                                {new Date(
                                  payment.blockTimestamp,
                                ).toLocaleDateString("en-US", {
                                  weekday: "long",
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </Table.Cell>
                            </Table.Row>,
                          );
                        }

                        const parts = payment.memo.split("_");
                        const bookingDate = parts[0];
                        const slotId = parts[1] || "N/A";

                        rows.push(
                          <Table.Row key={payment.txHash}>
                            <Table.Cell>
                              <Link
                                href={`/tx?txHash=${payment.txHash}&chainId=${payment.chainId}`}
                                style={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                {formatTimestamp(payment.blockTimestamp)}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>{formatDate(bookingDate)}</Table.Cell>
                            <Table.Cell>
                              <Flex align="center" gap="2">
                                <Avatar
                                  size="1"
                                  radius="full"
                                  fallback={getSlotEmoji(slotId)}
                                />
                                #{slotId}
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              {payment.senderEnsPrimaryName ||
                                truncateEthAddress(payment.senderAddress)}
                            </Table.Cell>
                            <Table.Cell>
                              {payment.invoiceAmount} {payment.invoiceCurrency}
                            </Table.Cell>
                          </Table.Row>,
                        );
                      });
                    } else {
                      // For upcoming and past tabs, group by booking date
                      filteredPayments.forEach((payment) => {
                        const parts = payment.memo.split("_");
                        const bookingDate = parts[0];
                        const slotId = parts[1] || "N/A";

                        if (bookingDate !== lastDate) {
                          lastDate = bookingDate;
                          rows.push(
                            <Table.Row key={`date-${bookingDate}`}>
                              <Table.Cell
                                colSpan={5}
                                style={{
                                  backgroundColor: "var(--gray-3)",
                                  fontWeight: "bold",
                                  padding: "8px 16px",
                                }}
                              >
                                {formatDate(bookingDate)}
                              </Table.Cell>
                            </Table.Row>,
                          );
                        }

                        rows.push(
                          <Table.Row key={payment.txHash}>
                            <Table.Cell>
                              <Link
                                href={`/tx?txHash=${payment.txHash}&chainId=${payment.chainId}`}
                                style={{
                                  textDecoration: "none",
                                  color: "inherit",
                                }}
                              >
                                {formatTimestamp(payment.blockTimestamp)}
                              </Link>
                            </Table.Cell>
                            <Table.Cell>{formatDate(bookingDate)}</Table.Cell>
                            <Table.Cell>
                              <Flex align="center" gap="2">
                                <Avatar
                                  size="1"
                                  radius="full"
                                  fallback={getSlotEmoji(slotId)}
                                />
                                #{slotId}
                              </Flex>
                            </Table.Cell>
                            <Table.Cell>
                              {payment.senderEnsPrimaryName ||
                                truncateEthAddress(payment.senderAddress)}
                            </Table.Cell>
                            <Table.Cell>
                              {payment.invoiceAmount} {payment.invoiceCurrency}
                            </Table.Cell>
                          </Table.Row>,
                        );
                      });
                    }

                    return rows;
                  })()}
                </Table.Body>
              </Table.Root>
            </Grid>
          )}
        </Box>
      </Tabs.Root>
    </Box>
  );
}
