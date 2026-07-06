import DonationDetailClient from "./DonationDetailClient";

export function generateStaticParams() {
  return [{ id: "review" }];
}

export default function DonationDetailPage() {
  return <DonationDetailClient />;
}
