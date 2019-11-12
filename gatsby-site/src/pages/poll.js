import React, { useRef, useEffect, useState } from 'react';
import { providers, Contract, utils } from 'ethers';
import styled from 'styled-components';
import { layout, space } from 'styled-system';
import panUtils from 'panvala-utils';

import Box from '../components/system/Box';
import Layout from '../components/Layout';
import SEO from '../components/seo';
import Nav from '../components/Nav';
import Button from '../components/Button';
import pollOne from '../img/poll-1.png';
import pollTwo from '../img/poll-2.png';
import { calculateTotalPercentage } from '../utils/poll';
import { sliceDecimals } from '../utils/format';
import {
  ModalBody,
  ModalOverlay,
  ModalTitle,
  ModalCopy,
  ModalSubTitle,
} from '../components/WebsiteModal';

const categories = [
  {
    categoryID: 1,
    title: 'Ethereum 2.0',
    previous: 34,
    description:
      'These grants fund work that scales the base layer of the Ethereum network by implementing the Ethereum 2.0 roadmap. Past Panvala grant recipients in this category are Prysmatic Labs, Sigma Prime, Nimbus, and Whiteblock. Other teams in our community that do this kind of work are ChainSafe and Harmony.',
  },
  {
    categoryID: 2,
    title: 'Layer 2 Scaling',
    previous: 5,
    description:
      'These grants fund work that scale Ethereum without modifying the base layer. Past Panvala grant recipients in this category are Connext, Counterfactual, Plasma Group, and Prototypal. Other teams in our community that do this kind of work are LeapDAO, OmiseGo, and Raiden.',
  },
  {
    categoryID: 3,
    title: 'Security',
    previous: 16,
    description:
      'These grants fund work that make it easier to build and run Ethereum applications that perform their intended functions without bugs or security flaws. Past Panvala grant recipients in this category are Level K, ConsenSys Diligence, Runtime Verification, and Dapphub. Other teams in our community that do this kind of work are Zeppelin, Trail of Bits, and Quantstamp.',
  },
  {
    categoryID: 4,
    title: 'Developer Tools and Growth',
    previous: 4,
    description:
      'These grants fund work that increase the productivity of Ethereum developers, and make it easier for new developers to get started so we can reach One Million Developers in 2020. Past Panvala grant recipients in this category are ethers.js, Asseth, and Tenderly. Other teams in our community that do this kind of work are Truffle, Embark, and Cryptoeconomics.study.',
  },
  {
    categoryID: 5,
    title: 'Dapps and Usability',
    previous: 4,
    description:
      'These grants fund work that produces Ethereum-based applications, games, and user experience improvements that bring more users to Ethereum. Past Panvala grant recipients in this category are BrightID, Gnosis, and Bounties Network. Other teams in our community that do this kind of work are MetaCartel DAO, Axie Infinity, Burner Wallet and Universal Login.',
  },
  {
    categoryID: 6,
    title: 'Panvala',
    previous: 37,
    description:
      'These grants fund work that improves Panvala itself and produces recommendations for the network to evaluate. Past Panvala grant recipients in this category are ConsenSys PAN and The Astrotrope.',
  },
];

const ClipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  ${layout};
  ${space};
`;
const Poll = () => {
  const pollFormRef = useRef(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [ptsRemaining, setPtsRemaining] = useState(100);
  const [provider, setProvider] = useState();
  const [allocations, setAllocations] = useState([]);
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [percentages, setPercentages] = useState({
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      // Listen for network changes -> reload page
      window.ethereum.on('networkChanged', network => {
        console.log('MetaMask network changed:', network);
        window.location.reload();
      });
      window.ethereum.on('accountsChanged', network => {
        console.log('MetaMask account changed:', network);
        window.location.reload();
      });
    }
  }, []);

  function handleViewPollClick() {
    pollFormRef.current.scrollIntoView({
      behavior: 'smooth',
    });
  }

  async function setSelectedAccount() {
    let selectedAccount = (await provider.listAccounts())[0];
    // user not enabled for this app
    if (!selectedAccount) {
      try {
        selectedAccount = (await window.ethereum.enable())[0];
      } catch (error) {
        if (error.stack.includes('User denied account authorization')) {
          alert(
            'MetaMask not enabled. In order to respond to the poll, you must authorize this app.'
          );
        }
      }
    }
    await setAccount(selectedAccount);
    return selectedAccount;
  }

  useEffect(() => {
    async function getBalance() {
      const tokenAbi = panUtils.contractABIs.BasicToken;
      const token = new Contract(
        '0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44',
        tokenAbi.abi,
        provider
      );
      let acct = (await provider.listAccounts())[0];
      if (!acct) {
        acct = await setSelectedAccount();
      }
      const bal = await token.balanceOf(acct);
      const balance = utils.formatUnits(bal, 18);
      setBalance(sliceDecimals(balance.toString()));
    }
    if (
      typeof window !== 'undefined' &&
      typeof window.ethereum !== 'undefined' &&
      typeof provider !== 'undefined'
    ) {
      setSelectedAccount();
      getBalance();
    }
  }, [provider]);

  async function connectWallet() {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      if (typeof provider === 'undefined') {
        const p = new providers.Web3Provider(window.ethereum);
        await setProvider(p);
      } else if (!account) {
        await setSelectedAccount();
      }
    } else {
      alert('MetaMask not found. Please download MetaMask @ metamask.io');
    }
  }

  // User changes a poll value
  function handleChange(value, categoryID) {
    setPercentages({
      ...percentages,
      [categoryID]: value,
    });
  }

  function handleChangeField(e) {
    setFields({
      ...fields,
      [e.target.id]: e.target.value,
    });
  }

  // Triggered by change in values
  useEffect(() => {
    const subtotal = calculateTotalPercentage(percentages);
    // Change the display amount of points remaining
    setPtsRemaining(100 - subtotal);
  }, [percentages]);

  // User submits the poll
  async function handleFormSubmit(event) {
    event.preventDefault();
    if (!provider) {
      await connectWallet();
    }

    // Calculate the sum of the percentages
    const totalPercentage = calculateTotalPercentage(percentages);

    if (totalPercentage < 100) {
      alert(`Please allocate all 100 percentage points (current subtotal: ${totalPercentage})`);
      return;
    } else if (totalPercentage > 100) {
      alert(`Please allocate just 100 percentage points (current subtotal: ${totalPercentage})`);
      return;
    }

    const percentValues = Object.keys(percentages);

    // Create a new array of invalid percentages (0 - 100)
    const zeroToHundred = /^[0-9][0-9]?$|^100$/;
    const invalidPercentages = percentValues.reduce((acc, val) => {
      if (zeroToHundred.test(percentages[val]) || percentages[val] === '') {
        return acc;
      }
      return [...acc, { [val]: percentages[val] }];
    }, []);
    console.log('invalidPercentages:', invalidPercentages);

    // Valid percentages
    if (invalidPercentages.length === 0 && totalPercentage === 100) {
      // Format allocations
      const allocations = categories.map(c => {
        const cid = c.categoryID;
        let points = percentages[cid];
        if (points === '') {
          points = 0;
        }
        return {
          categoryID: cid,
          points: parseInt(points),
        };
      });

      // console.log('allocations:', allocations);
      setAllocations(allocations);
    }
  }

  // Triggered by validation of form, formatting of allocations
  useEffect(() => {
    if (account && allocations) {
      console.log('form valid');
      postPoll();
    }
  }, [account, allocations]);

  // Posts poll to database
  async function postPoll() {
    function generateMessage(account, pollID) {
      // Always use checksum address in the message
      return `Response from ${account} for poll ID ${pollID}`;
    }

    console.log('panUtils:', panUtils);
    const pollID = '1';
    const message = generateMessage(account, pollID);

    const signer = provider.getSigner();
    let signature;
    try {
      signature = await signer.signMessage(message);
    } catch (error) {
      alert('Message signature rejected. Vote was not submitted to poll.');
      return;
    }

    const data = {
      response: {
        account,
        allocations,
      },
      signature,
    };

    console.log('data:', data);

    const apiHost =
      process.env.GATSBY_PANVALA_ENV === 'development'
        ? 'http://localhost:5001'
        : process.env.GATSBY_PANVALA_ENV === 'staging'
        ? 'https://staging-api.panvala.com'
        : 'https://api.panvala.com';
    const endpoint = `${apiHost}/api/polls/${pollID}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Origin, Content-Type',
      },
    });
    const json = await res.json();
    console.log('json:', json);

    // Response errors
    if (res.status !== 200) {
      console.log('res:', res);
      if (json.hasOwnProperty('errors') && json.errors.length > 0) {
        console.log('ERROR:', json.errors);
      }
      if (json.hasOwnProperty('msg')) {
        if (json.msg.includes('Invalid poll response request data')) {
          alert(
            'Poll form validation failed. Please verify each field and try again, or contact the Panvala team @ info@panvala.com'
          );
        }
        if (json.msg.includes('Signature does not match account')) {
          alert(
            'Message signature did not match the signing account. Vote was not submitted to poll.'
          );
        }
        if (json.msg.includes('Validation error')) {
          if (json.errors[1].message === 'account must be unique') {
            alert('Each account may only vote once per poll. Vote was not submitted to poll.');
          }
        }
      }
    } else {
      setPtsRemaining(100);
      setPercentages({ 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' });
      setModalOpen(true);
    }
  }

  return (
    <Layout>
      <SEO title="Poll" />

      <section className="bg-gradient bottom-clip-up-1">
        <Nav account={account} balance={balance} handleClick={connectWallet} />

        {/* <!-- Instructions --> */}
        <ClipContainer p={['1rem 0 4rem', '5rem 6rem']}>
          <Box width={[1, 1, 0.5]} px={['4', '4', '2']}>
            <h1 className="white f1-5 b ma0 mb4 w-80-l w-100">The Panvala Poll</h1>
            <div className="f5 lh-copy mb3">
              <p className="w-60 mb0 white b">
                We're polling PAN holders on their funding priorities in the Ethereum ecosystem.
              </p>
              <p className="white-60 fw4 ma0 w-50-l w-100">
                The results of the poll will shape Panvala's next quarterly budget of 2,000,000 PAN,
                which will be released on January 31.
              </p>
            </div>
            <div className="mv3 b">
              <button
                className="f6 link dim bn br-pill white bg-teal fw7 pointer pv3 ph4"
                onClick={handleViewPollClick}
              >
                View Poll
              </button>
            </div>
          </Box>
          <Box width={[1, 1, 0.5]} p={[4, 2]} display={['none', 'none', 'block']}>
            <img src={pollOne} className="w-100 center" />
          </Box>
        </ClipContainer>
      </section>

      {/* Fund work that matters */}
      <section className="cf w-100 ph6 bottom-clip-down bg-white flex justify-between items-center">
        <div className="w-100 w-25-ns pa2 dib">
          <img src={pollTwo} className="center" />
        </div>
        <div className="w-100 w-50-ns pa2 dib">
          <h2>Fund work that matters</h2>
          <p className="lh-copy">
            PAN tokens have been granted to teams that the whole Ethereum community depends on. The
            more tokens you acquire to vote, the more work those teams can fund with their tokens.
          </p>
          <Button
            handleClick={connectWallet}
            text={account ? 'Wallet connected!' : 'Connect your wallet'}
          />
        </div>
      </section>

      {/* Ballot */}
      <section id="poll-form" ref={pollFormRef} className="pv6 mb4 bg-gray full-clip-down-lg">
        <div className="w-100 w-60-ns center">
          <div className="w-70 center tc lh-copy">
            This poll is for PAN-holders to signal their preferences for the next batch of grant
            allocations. If you do not currently have a PAN balance but want to vote, or you would
            like to increase your voting power before the <b>November 19</b> deadline, you can do so
            via{' '}
            <a
              href="https://uniswap.exchange?outputCurrency=0xD56daC73A4d6766464b38ec6D91eB45Ce7457c44"
              target="_blank"
              className="link b dim blue"
            >
              Uniswap
            </a>
          </div>

          <div className="tc pv4">
            <h2>Category Ballot</h2>
            <p className="w-40 center tc lh-copy">
              Please distribute 100 percentage points between the following categories:
            </p>
          </div>

          <div className="bg-white shadow lh-copy black">
            <form>
              {categories.map((category, index) => {
                const { description, title, previous } = category;
                const identifier = `poll-points-category-${index}`;

                return (
                  <div key={identifier} className="cf pa3 bb bw-2 b--black-10">
                    <div className="fl w-80 pa2 pr4">
                      <div className="f4 b">{title}</div>
                      <p>{description}</p>
                    </div>
                    <div className="fl w-20 pa2 f5 tr">
                      <div className="b ttu f6 o-50">previous batch</div>
                      <div className="pb3">{previous}%</div>
                      <div className="b ttu f6 o-50">
                        <label className="ma0 mb3">Batch five</label>
                      </div>
                      <div>
                        <input
                          type="number"
                          name={identifier}
                          id={identifier}
                          max="100"
                          min="0"
                          required
                          placeholder="%"
                          onChange={e => handleChange(e.target.value, category.categoryID)}
                          value={percentages[category.categoryID]}
                          className="f6 input-reset b--black-10 pv3 ph2 db w-100 br3 mt2 tr"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* <-- name and email --> */}
              <div className="pa4 bb bw-2 b--black-10 black-60">
                <Box color="black" display="flex" justifyContent="flex-end" mb={4}>
                  Points Remaining:&nbsp;<b>{ptsRemaining}</b>
                </Box>
                <div className="cf pv2">
                  <div className="fl w-50 pr3">
                    <label>First Name (Optional)</label>
                    <input
                      type="text"
                      id="firstName"
                      placeholder="Enter your first name"
                      className="w-100 pa2"
                      value={fields.firstName}
                      onChange={handleChangeField}
                    ></input>
                  </div>
                  <div className="fl w-50">
                    <label>Last Name (Optional)</label>
                    <input
                      type="text"
                      id="lastName"
                      placeholder="Enter your last name"
                      className="w-100 pa2"
                      value={fields.lastName}
                      onChange={handleChangeField}
                    ></input>
                  </div>
                </div>
                <div className="pv2">
                  <label>Email (Optional)</label>
                  <input
                    type="text"
                    id="email"
                    placeholder="Enter your email"
                    className="w-100 pa2"
                    value={fields.email}
                    onChange={handleChangeField}
                  ></input>
                </div>
              </div>

              <div className="cf pa4">
                <div className="f5 tl pb3 lh-copy">
                  The final poll results will be calculated using the balance of PAN tokens in your
                  account on November 19.
                </div>
                <div className="f5 tl pb4 lh-copy">
                  <b>
                    Reminder: You will not lose any tokens or ETH for participating in this poll.
                  </b>
                </div>
                <div className="fr w-100 w-70-l flex-column items-end">
                  <div className="flex justify-end">
                    <input
                      type="submit"
                      name="submit"
                      onClick={handleFormSubmit}
                      className="f6 link dim bn br-pill pv3 ph4 bg-teal white fw7"
                      value="Submit Vote"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
        {modalOpen && (
          <div className="flex justify-center h5">
            <ModalOverlay handleClick={() => setModalOpen(false)} />
            <ModalBody>
              <ModalTitle>Thank you for voting!</ModalTitle>
              <ModalSubTitle>{`Current voting weight: ${balance} PAN`}</ModalSubTitle>
              <ModalCopy>
                Thank you for voting in the poll for the current batch. Your vote helps decide which
                types of grants are awarded. Here is what you voted for:
              </ModalCopy>
              <Box width="95%" mt="3">
                <Box display="flex" flexDirection="column">
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    pb="2"
                    px="2"
                    fontWeight="bold"
                    color="black"
                  >
                    <Box>Category</Box>
                    <Box>Allocation</Box>
                  </Box>
                  {categories.map((c, i) => (
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      key={c.categoryID}
                      bg={i % 2 === 0 && '#F5F6F9'}
                      p={2}
                    >
                      <Box>{c.title}</Box>
                      <Box>{`${allocations.length && allocations[c.categoryID - 1].points}%`}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </ModalBody>
          </div>
        )}
      </section>
    </Layout>
  );
};

export default Poll;
