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
    const list: string[] = [];
    list.push(this.subject);
    for (const item of Object.entries(this.headers)) {
      list.push(`${item[0]}: ${item[1]}`);
    }
    if (this.body && this.body.length > 0) {
      list.push(`Content-Length: ${this.body.length}`);
    } else {
      list.push('Content-Length: 0');
    }
    list.push('');
    list.push(this.body);
    return list.join('\r\n');
  }
}
