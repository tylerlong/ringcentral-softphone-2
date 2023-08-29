export class SipMessage {
  public static fromString(message: string): SipMessage {
    let tokens = message.split('\r\n\r\n');
    const init = tokens[0];
    const body = tokens.slice(1).join('\r\n\r\n');
    tokens = init.split('\r\n');
    const subject = tokens[0];
    const headers = Object.fromEntries(tokens.slice(1).map((line) => line.split(': ')));
    return new SipMessage(subject, headers, body);
  }

  public subject: string;
  public headers: { [name: string]: string | number };
  public body: string;

  public constructor(subject: string, headers: { [name: string]: string | number }, body = '') {
    this.subject = subject;
    this.headers = headers;
    this.body = body;
  }

  public toString(): string {
    return `${this.subject}\r\n${Object.entries(this.headers)
      .map((entries) => entries.join(': '))
      .join('\r\n')}\r\nContent-Length: ${this.body.length}\r\n\r\n${this.body}`.trim();
  }
}
