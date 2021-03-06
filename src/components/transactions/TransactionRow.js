import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import ReactTooltip from 'react-tooltip';
import Confirm from '../modals/Confirm';
import RowCategorizer from './RowCategorizer';
import IgnoreTransaction from './IgnoreTransaction';
import GroupedTransaction from './GroupedTransaction';
import ConfirmDelete from './ConfirmDelete';
import { formatNumber } from '../../util';

const Amount = props => {
  const fractions = props.roundAmount ? 0 : 2;
  const amount = formatNumber(props.amount, {
    minimumFractionDigits: fractions,
    maximumFractionDigits: fractions
  });
  const fullAmount = formatNumber(props.amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const amountTip = <ReactTooltip
    id={`amount-tip-${props.amountId}`}
    className="text-left"
  >
    {props.roundAmount && <span>
        Full amount: {fullAmount}<br />
      </span>}
    {props.hasMultipleAccounts && <>
      Currency: {props.account.currency}<br />
      Account: {props.account.name}
      </>}
  </ReactTooltip>;

  return (
    <>
      <span
        className="cursor-help"
        data-tip=""
        data-for={`amount-tip-${props.amountId}`}
      >
        {amount}
      </span>
      {amountTip}
    </>
  );
};

Amount.propTypes = {
  amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  hasMultipleAccounts: PropTypes.bool.isRequired,
  roundAmount: PropTypes.bool.isRequired,
  amountId: PropTypes.string.isRequired
};

const TransactionRow = props => {
  const handleDelete = async () => {
    await props.hideModal(Confirm.modalName);
    props.handleDeleteRow(props.transaction.id);
  };

  const handleDeleteConfirm = () => {
    props.showModal(Confirm.modalName, {
      handleYes: handleDelete,
      yesLabel: "Yes, delete it",
      yesButtonClass: "btn-danger",
      body: <ConfirmDelete
        transactionDate={props.transaction.date.format('L')}
        transactionDescription={props.transaction.description}
      />
    });
  }

  const handleRowSelect = () => props.handleRowSelect(props.transaction.id);

  let className = '';
  if (props.isSelected) className = 'table-primary';
  else if (props.transaction.ignore) className = 'table-warning';

  const account = props.accounts[props.transaction.account] || { name: 'N/A' };
  const hasMultipleAccounts = Object.keys(props.accounts).length >= 2;

  return (
    <tr className={className}>
      <td className="text-nowrap" onClick={handleRowSelect}>
        {props.transaction.date.format('L')}
      </td>
      <td onClick={handleRowSelect}>
        {props.transaction.description}
        <GroupedTransaction
          transactionId={props.transaction.id}
          transactionGroup={props.transactionGroup}
          handleDeleteTransactionGroup={props.handleDeleteTransactionGroup}
        />
      </td>
      <td className="text-right">
        <Amount
          amountId={`amount-${props.transaction.id}`}
          amount={props.transaction.amount}
          account={account}
          hasMultipleAccounts={hasMultipleAccounts}
          roundAmount={props.roundAmount}
        />
      </td>
      <td className="text-right">
        <Amount
          amountId={`total-${props.transaction.id}`}
          amount={props.transaction.total}
          account={account}
          hasMultipleAccounts={hasMultipleAccounts}
          roundAmount={props.roundAmount}
        />
      </td>
      <td className="text-nowrap">
        <RowCategorizer
          transaction={props.transaction}
          handleRowCategoryChange={props.handleRowCategoryChange}
          showCreateCategoryModal={props.showCreateCategoryModal}
        />
      </td>
      <td className="text-nowrap">
        <div className="d-inline-flex">
          <IgnoreTransaction
            transactionId={props.transaction.id}
            handleIgnoreRow={props.handleIgnoreRow}
            isIgnored={!!props.transaction.ignore}
          />
          <FontAwesomeIcon
            icon="trash-alt"
            className="cursor-pointer text-danger"
            data-tip="Delete row"
            onClick={handleDeleteConfirm}
            fixedWidth
          />
        </div>
      </td>
    </tr>
  );
};

TransactionRow.propTypes = {
  transaction: PropTypes.shape({
    id: PropTypes.string.isRequired,
    date: PropTypes.instanceOf(moment),
    ignore: PropTypes.bool,
    categoryGuess: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    }),
    categoryConfirmed: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  }).isRequired,
  accounts: PropTypes.object.isRequired,
  showCreateCategoryModal: PropTypes.func.isRequired,
  showModal: PropTypes.func.isRequired,
  hideModal: PropTypes.func.isRequired,
  handleDeleteRow: PropTypes.func.isRequired,
  handleIgnoreRow: PropTypes.func.isRequired,
  handleRowCategoryChange: PropTypes.func.isRequired,
  handleRowSelect: PropTypes.func.isRequired,
  roundAmount: PropTypes.bool.isRequired,
  handleDeleteTransactionGroup: PropTypes.func.isRequired,
  transactionGroup: PropTypes.shape({
    groupId: PropTypes.string.isRequired,
    linkedTransactions: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      date: PropTypes.instanceOf(moment)
    })).isRequired
  }),
};

export default TransactionRow;
