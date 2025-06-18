
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Star, Zap } from 'lucide-react';
import { createCheckoutSession } from '@/api/functions';
import { createPortalSession } from '@/api/functions';
import { Subscription, User } from '@/api/entities';

// IMPORTANT: Replace these with your actual LIVE Price IDs from Stripe
const MONTHLY_PRICE_ID = "price_1Rap2rBOLHg6vI3B87CMpKSU";
const YEARLY_PRICE_ID = "price_1Rap4cBOLHg6vI3BmaM22cH8";

const ProFeatures = [
  "Unlimited conversations",
  "Access to all AI models",
  "Full Memory & Context",
  "Collaborative Code Canvas",
  "Autonomous AI Brainstorming",
  "Custom API Tool Integration",
];

const PricingTier = ({ title, price, period, description, features, priceId, onSubscribe, isLoading, isCurrentPlan, subscription }) => (
  <Card className={`glass-effect flex flex-col ${
    isCurrentPlan
      ? "border-green-500/50 bg-green-500/5"
      : "border-purple-500/30"
  }`}>
    <CardHeader className="pb-4">
      <div className="flex justify-between items-center">
        <CardTitle className={`text-2xl font-bold ${isCurrentPlan ? 'text-green-400' : 'text-white'}`}>
          {title}
          {isCurrentPlan && (
            <span className="ml-2 text-sm bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
              Current Plan
            </span>
          )}
        </CardTitle>
        {title === "Yearly" && !isCurrentPlan && (
          <span className="bg-purple-500/20 text-purple-300 text-xs font-bold px-3 py-1 rounded-full">SAVE 20%</span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-4xl font-extrabold ${isCurrentPlan ? 'text-green-400' : 'text-white'}`}>
          {price}
        </span>
        <span className="text-gray-400">/ {period}</span>
      </div>
      <CardDescription className="text-gray-300 pt-2">{description}</CardDescription>
      {isCurrentPlan && subscription && (
        <div className="text-sm text-green-400 mt-2">
          Renews on {new Date(subscription.current_period_end).toLocaleDateString()}
        </div>
      )}
    </CardHeader>
    <CardContent className="flex-1 flex flex-col justify-between">
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <Check className={`w-5 h-5 ${isCurrentPlan ? 'text-green-400' : 'text-green-400'}`} />
            <span className={`${isCurrentPlan ? 'text-green-200' : 'text-gray-200'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onSubscribe(priceId)}
        disabled={isLoading || isCurrentPlan}
        className={`w-full text-lg py-6 ${
          isCurrentPlan
            ? "bg-gray-600 cursor-not-allowed text-gray-300"
            : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        }`}
      >
        {isCurrentPlan ? "Current Plan" : (isLoading ? "Processing..." : "Subscribe")}
      </Button>
    </CardContent>
  </Card>
);

export default function BillingPage() {
    const [subscription, setSubscription] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPriceId, setCurrentPriceId] = useState(null);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const subs = await Subscription.filter({}, '-created_date', 1);
                if (subs.length > 0 && ['active', 'trialing'].includes(subs[0].status)) {
                    setSubscription(subs[0]);
                    setCurrentPriceId(subs[0].stripe_price_id);
                }
            } catch (error) {
                console.error("Failed to fetch subscription status", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSubscription();
    }, []);

    const handleSubscribe = async (priceId) => {
        setIsLoading(true);
        try {
            const baseUrl = window.location.origin;
            const { data } = await createCheckoutSession({
                priceId,
                success_url: `${baseUrl}/Billing?success=true`,
                cancel_url: `${baseUrl}/Billing?canceled=true`
            });
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Failed to create checkout session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setIsLoading(true);
        try {
            const { data } = await createPortalSession({
                return_url: window.location.href
            });
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error("Failed to create portal session", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-white">Loading billing information...</div>;
    }

    if (subscription) {
        return (
            <div className="p-8 bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 min-h-screen">
                <div className="text-center max-w-3xl mx-auto mb-8">
                    <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl gradient-text mb-4">
                        Your Subscription
                    </h1>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        You're all set with CollabAI Pro! Manage your subscription or explore other options below.
                    </p>
                </div>

                <div className="max-w-2xl mx-auto mb-12">
                    <Card className="glass-effect border-green-500/30">
                        <CardHeader>
                            <CardTitle className="text-green-400 text-2xl flex items-center gap-2">
                                <Star className="w-6 h-6"/> You are on the Pro Plan!
                            </CardTitle>
                            <CardDescription className="text-gray-300 pt-2">
                                You have access to all premium features. Your subscription will renew on {new Date(subscription.current_period_end).toLocaleDateString()}.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleManageBilling}
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                            >
                                {isLoading ? "Processing..." : "Manage Billing & Invoices"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <PricingTier
                        title="Monthly"
                        price="$10"
                        period="month"
                        description="Switch to monthly billing if you prefer flexibility."
                        features={ProFeatures}
                        priceId={MONTHLY_PRICE_ID}
                        onSubscribe={handleSubscribe}
                        isLoading={isLoading}
                        isCurrentPlan={currentPriceId === MONTHLY_PRICE_ID}
                        subscription={subscription}
                    />
                    <PricingTier
                        title="Yearly"
                        price="$8"
                        period="month"
                        description="Switch to yearly billing and save 20%!"
                        features={ProFeatures}
                        priceId={YEARLY_PRICE_ID}
                        onSubscribe={handleSubscribe}
                        isLoading={isLoading}
                        isCurrentPlan={currentPriceId === YEARLY_PRICE_ID}
                        subscription={subscription}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-gradient-to-br from-slate-950 via-purple-950/10 to-slate-950 min-h-screen">
            <div className="text-center max-w-3xl mx-auto">
                <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl gradient-text mb-4">
                    Unlock Full Potential
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                    Choose a plan to get unlimited access to all AI collaboration features and take your projects to the next level.
                </p>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <PricingTier
                    title="Monthly"
                    price="$10"
                    period="month"
                    description="Ideal for short-term projects and flexibility."
                    features={ProFeatures}
                    priceId={MONTHLY_PRICE_ID}
                    onSubscribe={handleSubscribe}
                    isLoading={isLoading}
                    isCurrentPlan={false}
                />
                <PricingTier
                    title="Yearly"
                    price="$8"
                    period="month"
                    description="Best value - $80/year (20% off monthly price!)"
                    features={ProFeatures}
                    priceId={YEARLY_PRICE_ID}
                    onSubscribe={handleSubscribe}
                    isLoading={isLoading}
                    isCurrentPlan={false}
                />
            </div>
        </div>
    );
}
