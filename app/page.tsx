"use client";

import { useEffect, useState } from 'react';
import { Button, Flex, Container, Text, Card, Heading, Box, Grid, Avatar } from '@radix-ui/themes';
import YappSDK, { FiatCurrency, isInIframe, UserContext } from '@yodlpay/yapp-sdk';
import productsData from './data/products.json';
import { YODL_ORIGIN_URL } from '@/lib/constants';
import { userDisplayName } from '@/lib/helpers';

export default function Home() {
  const { products } = productsData;
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const [userContext, setUserContext] = useState<UserContext | null>(null);

  const isEmbedded = isInIframe();

  // Initialize the SDK
  const sdk = new YappSDK({
    origin: YODL_ORIGIN_URL,
  });

  const handleBuy = async (product: any) => {
    try {
      setIsProcessing(product.id);

      console.log(`Initiating payment for ${product.title}`);

      // Determine the appropriate currency enum value
      const currency = product.currency === 'USD'
        ? FiatCurrency.USD
        : product.currency === 'EUR'
          ? FiatCurrency.EUR
          : FiatCurrency.USD; // Default to USD if currency not supported

      // Get the ENS or address from environment variables
      const receiverEnsOrAddress = process.env.NEXT_PUBLIC_ENS_OR_ADDRESS;

      if (!receiverEnsOrAddress) {
        throw new Error('Payment address not configured. Please set NEXT_PUBLIC_ENS_OR_ADDRESS in .env.local');
      }


      // Request payment using the Yapp SDK
      const response = await sdk.requestPayment({
        addressOrEns: receiverEnsOrAddress,
        amount: product.amount,
        currency: currency,
        memo: product.id, // Unique identifier for this order        
        redirectUrl: window.location.href, // Redirect back to this page after payment
      });

      // Handle successful payment
      console.log('Payment successful:', response);
      alert(`Payment for ${product.title} was successful!`);

    } catch (error) {
      // Handle payment errors
      console.error('Payment error:', error);

      if (error.message === 'Payment was cancelled') {
        alert('Payment was cancelled.');
      } else {
        alert(`Payment error: ${error.message || 'Unknown error'}`);
      }

    } finally {
      setIsProcessing(null);
    }
  };

  useEffect(() => {
    if (isEmbedded) {
      sdk.getUserContext().then(setUserContext);
    } else {
      setUserContext(null);
    }
  }, [sdk, setUserContext]);

  const displayName = userDisplayName(userContext);

  return (
    <Box style={{ minHeight: '100vh' }} p="6">
      <Container size="3">
        <Flex direction="column" gap="6" align="center">
          <Flex justify="between" width="100%" align="center">
            <Heading mb="2">QuickiePay</Heading>
            <Box>
              <Button variant="outline" size="2">
                {displayName}
              </Button>
            </Box>
          </Flex>

          <Box mt="6" width="100%">
            <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="4">
              {products.map((product) => (
                <Card key={product.id} size="2">
                  <Flex direction="column" style={{ height: '100%' }} justify="between">
                    <Box>
                      <Flex align="center" width="100%" gap="3" mb="2">
                        <Avatar
                          size="3"
                          radius="full"
                          fallback={product.emoji}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'var(--gray-3)'
                          }}
                        />
                        <Heading size="3">{product.title}</Heading>
                      </Flex>

                      <Text size="2" color="gray">{product.subtitle}</Text>
                    </Box>

                    <Box mt="3">
                      <Button
                        onClick={() => handleBuy(product)}
                        size="2"
                        style={{ width: '100%' }}
                        disabled={isProcessing === product.id}
                      >
                        {isProcessing === product.id
                          ? 'Processing...'
                          : `Buy for ${product.amount.toFixed(2)} ${product.currency}`
                        }
                      </Button>
                    </Box>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Box>
        </Flex>
      </Container>
    </Box>
  );
}
