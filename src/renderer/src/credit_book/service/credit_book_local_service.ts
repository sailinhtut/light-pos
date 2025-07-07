import Dexie, { Table } from "dexie";
import { Creditbook, decodeCreditbook } from "../interface/credit_book";

class CreditbookDatabase extends Dexie {
  creditBooks!: Table<Creditbook, string>;
  constructor() {
    super("creditbook_data");
    this.version(1).stores({
      creditBooks:
        "creditBookId,name,note,createdBy,createdDate,updatedDate,creditAmount,completed,parsedMonth,records,attachedOrders"
    });
  }
}

class CreditbookLocalService {
  db = new CreditbookDatabase();

  async getCreditbooks(): Promise<Creditbook[]> {
    const data = await this.db.creditBooks.toArray();
    const decoded = data.map((element) => decodeCreditbook(element));
    return decoded;
  }

  async getCreditbook(creditBookId: string): Promise<Creditbook | undefined> {
    const data = await this.db.creditBooks.get(creditBookId);
    return data ? decodeCreditbook(data) : undefined;
  }

  async saveCreditbooks(books: Creditbook[]) {
    await this.clearBooks();
    books.forEach(async (e) => {
      await this.db.creditBooks.add(e, e.creditBookId);
    });
  }

  async addCreditbook(creditBook: Creditbook): Promise<boolean> {
    await this.db.creditBooks.add(creditBook, creditBook.creditBookId);
    return true;
  }

  async updateCreditbook(creditBook: Creditbook): Promise<boolean> {
    await this.db.creditBooks.update(creditBook.creditBookId, { ...creditBook });
    return true;
  }
  async deleteCreditbook(creditBookId: string) {
    await this.db.creditBooks.delete(creditBookId);
  }
  async clearBooks() {
    await this.db.creditBooks.clear();
  }
}

export default CreditbookLocalService;
