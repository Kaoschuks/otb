import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { MemoryRouter } from 'react-router-dom';
import { mount } from 'enzyme';
import update from 'immutability-helper';
import * as actions from '../actions';
import TransactionAdd from './TransactionAdd';
import { defaultAccount } from '../data/accounts';

describe('Transaction Add', () => {
  const mockStore = configureStore();

  const baseData = {
    transactions: {
      import: {
        data: [
          ['Date', 'Description', 'Amount', 'Total'],
          ['2018-01-01', 'Cool stuff', 123, 456]
        ],
        skipRows: 1,
        columnSpec: [
          { type: 'date'},
          { type: 'description'},
          { type: 'amount'},
          { type: 'total'}
        ],
        dateFormat: '',
        account: defaultAccount.id
      }
    },
    accounts: {
      data: [defaultAccount]
    }
  };

  it('should save the added data', () => {
    const store = mockStore(baseData);

    const container = mount(
      <MemoryRouter>
        <Provider store={store}>
          <TransactionAdd />
        </Provider>
      </MemoryRouter>
    );

    // Replace the history push function with a mock.
    // This is not documented anywhere, so it might break...
    const push = jest.fn();
    container.instance().history.push = push;

    // Call the save function
    const wrapper = container.find('TransactionAdd').first();
    wrapper.instance().handleSave();

    // Should dispatch
    expect(store.getActions()).toEqual([
      { type: actions.IMPORT_SAVE_TRANSACTIONS }
    ]);

    expect(push).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/transactions');
  });

  describe('error validation', () => {
    it('should require some column specs like date and amount', () => {
      const data = update(baseData, {
        transactions: {
          import: {
            columnSpec: {
              0: {
                type: {
                  $set: ''
                }
              }
            }
          }
        }
      });
      const store = mockStore(data);

      const container = mount(
        <MemoryRouter>
          <Provider store={store}>
            <TransactionAdd />
          </Provider>
        </MemoryRouter>
      );

      // Call the save function
      const wrapper = container.find('TransactionAdd').first();
      wrapper.instance().handleSave();

      // Should not dispatch
      expect(store.getActions()).toEqual([]);

      wrapper.update();

      expect(wrapper.state()).toEqual({
        errors: [
          {
            type: 'columnSpec',
            message: 'Please select a date column'
          },
        ]
      });
    });

    it('should complain if all amounts cannot be parsed', () => {
      const data = update(baseData, {
        transactions: {
          import: {
            data: {
              1: {
                2: {
                  $set: 'n/a'
                }
              }
            }
          }
        }
      });
      const store = mockStore(data);

      const container = mount(
        <MemoryRouter>
          <Provider store={store}>
            <TransactionAdd />
          </Provider>
        </MemoryRouter>
      );

      // Call the save function
      const wrapper = container.find('TransactionAdd').first();
      wrapper.instance().handleSave();

      // Should not dispatch
      expect(store.getActions()).toEqual([]);

      wrapper.update();

      expect(wrapper.state()).toEqual({
        errors: [
          {
            type: 'amount',
            message: 'Cannot parse all amounts as numbers, perhaps you need to skip a header?'
          }
        ]
      });
    });

    it('should complain if all dates cannot be parsed', () => {
      const data = update(baseData, {
        transactions: {
          import: {
            data: {
              1: {
                0: {
                  $set: 'n/a'
                }
              }
            }
          }
        }
      });
      const store = mockStore(data);

      const container = mount(
        <MemoryRouter>
          <Provider store={store}>
            <TransactionAdd />
          </Provider>
        </MemoryRouter>
      );

      // Call the save function
      const wrapper = container.find('TransactionAdd').first();
      wrapper.instance().handleSave();

      // Should not dispatch
      expect(store.getActions()).toEqual([]);

      wrapper.update();

      expect(wrapper.state()).toEqual({
        errors: [
          {
            type: 'date',
            message: 'Cannot parse all dates correctly, ' +
              'perhaps you need to skip a header, or change the date format?'
          }
        ]
      });
    });

    it('should complain if account is empty', () => {
      const data = update(baseData, {
        transactions: {
          import: {
            account: {
              $set: ''
            }
          }
        }
      });
      const store = mockStore(data);

      const container = mount(
        <MemoryRouter>
          <Provider store={store}>
            <TransactionAdd />
          </Provider>
        </MemoryRouter>
      );

      // Call the save function
      const wrapper = container.find('TransactionAdd').first();
      wrapper.instance().handleSave();

      // Should not dispatch
      expect(store.getActions()).toEqual([]);

      wrapper.update();

      expect(wrapper.state()).toEqual({
        errors: [
          {
            type: 'account',
            message: 'Account is required'
          }
        ]
      });
    });
  });

  describe('upload', () => {
    const baseData = {
        transactions: {
          import: {
            data: []
          }
        },
        accounts: {
          data: [defaultAccount]
        }
    };

    it('should complain if columns are uneven in length', async () => {
      const store = mockStore(baseData);

      const container = mount(
        <MemoryRouter>
          <Provider store={store}>
            <TransactionAdd />
          </Provider>
        </MemoryRouter>
      );

      // Call the save function
      const wrapper = container.find('TransactionAdd').first();

      const fileContents = 'a,b,c\ne,f';
      const file = new File(
        [new Blob([fileContents], {type : 'text/plain'})],
        'file.csv',
        { type: 'text/plain' }
      );

      // Instead of simulating a file change on the input box itself, explicitly
      // call the handleFileChange function so we can wait for it to finish.
      await wrapper.find('FileInput').first().props().handleFileChange({
        target: {
          files: [
            file
          ]
        }
      });

      // Should dispatch a start and stop action
      expect(store.getActions()).toEqual([
        { type: actions.IMPORT_PARSE_TRANSACTIONS_START },
        { type: actions.IMPORT_PARSE_TRANSACTIONS_END, transactions: [] }
      ]);

      // Should report an error
      expect(wrapper.state().errors.length).toEqual(1);
      expect(wrapper.state().errors[0].type).toEqual('upload')
      expect(wrapper.state().errors[0].message).toContain('Cannot parse the file');
    });
  })
});