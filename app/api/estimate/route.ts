import { generateEstimate }
from "@/lib/excel";

export async function POST(
  req: Request
) {

  try {

    const body =
      await req.json();

    const result =
      await generateEstimate(
        body
      );

    return Response.json(
      result
    );

  } catch (err: any) {

    console.log(err);

    return Response.json({

      error:
        err.message,
    });
  }
}