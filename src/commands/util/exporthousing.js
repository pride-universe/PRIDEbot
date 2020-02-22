
const { Command } = require('discord.js-commando');
const XLSX = require('xlsx');

function format(row, field) {
  const val = row[field];
  return val;
}

function getXLSXBook(data, cols, grouping) {
  const book = XLSX.utils.book_new();
  const exportData = [
    cols.map(c => c.title),
    ...data.map(e => cols.map(c => format(e, c.field, grouping))),
  ];
  const sheet = XLSX.utils.aoa_to_sheet(exportData);
  XLSX.utils.book_append_sheet(book, sheet);
  return book;
}

function getXLSXData(rows, cols) {
  const book = getXLSXBook(rows, cols);
  return XLSX.write(book, {type: 'buffer'});
}

class Currency extends Command {
  constructor(client) {
    super(client, {
      name: 'exporthousing',
      aliases: ['eh'],
      group: 'util',
      memberName: 'exporthousing',
      description: 'Export historical housings to xslx file.',
      examples: ['exporthousing'],
      guildOnly: false,
      clientPermissions: [],
      format: '',
    });
  }
  async run(msg) {
    const cols = [
      {
        title: 'test',
        field: 'test',
      },
      {
        title: 'test2',
        field: 'test2',
      },
    ];
    const rows = [{
      test: 1,
      test2: 2,
    }];
    msg.reply({files: [{attachment: getXLSXData(rows, cols), name: 'exported.xlsx'}]});
  }
}

module.exports = Currency;