interface RawCircular {
  CirID: number | string;
  SNo: number | string;
  Subject: string;
  Notice?: string | null;
  DateFrom: string;
  DateTo: string;
  EmployeeName: string;
}

interface RawData {
  state: string | RawCircular[];
}

interface FormattedCircular {
  id: number | string;
  serial_no: number | string;
  subject: string;
  description: string;
  date_from: string;
  date_to: string;
  issued_by: string;
}

interface FormattedResponse {
  circulars: FormattedCircular[];
}

export function normalizeCirculars(rawData: RawData): FormattedResponse {
  if (!rawData || !rawData.state) {
    throw new Error("Invalid input: missing 'state'");
  }

  const circulars: RawCircular[] =
    typeof rawData.state === "string"
      ? JSON.parse(rawData.state) as RawCircular[]
      : rawData.state;

  return {
    circulars: circulars.map((item) => ({
      id: item.CirID,
      serial_no: item.SNo,
      subject: item.Subject,
      description: item.Notice ?? "",
      date_from: item.DateFrom,
      date_to: item.DateTo,
      issued_by: item.EmployeeName,
    })),
  };
}