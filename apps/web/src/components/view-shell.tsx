import { Card, CardHeader, CardTitle } from "~/components/ui/card";

// What a route shows before its content exists: the page heading and one empty card.
export function ViewShell(props: { readonly heading: string; readonly cardTitle: string }) {
  return (
    <>
      <h1 className="sr-only">{props.heading}</h1>
      <Card className="min-h-80">
        <CardHeader>
          <CardTitle>{props.cardTitle}</CardTitle>
        </CardHeader>
      </Card>
    </>
  );
}
