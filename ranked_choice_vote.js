
/* Ranked Choice Voting by Seamus Campbell (seamus@seamuscampbell.nyc) with assistance from ChatGPT and CodeConvert (for translating from PHP) */

class RankedChoiceVote {
    /*
    Algorithm methodology:
        Put all candidates into a 2-dimensional array with the first dimension being the individual ballot and the second dimension being the order
        After each round, see who has the most votes at the front of their rankings
        If a candidate passes the win number (simple majority), remove them from contention
        If the number of spots for winning candidates is full, stop
        Otherwise, order the rankings and find the candidate with the fewest number of votes BUT if there is a "protected candidate" (e.g. "No Endorsement"), find the candidate with the second-fewest votes
        Remove the found candidate from all of the ballots (i.e. every candidate goes up one rank)
        Continue the process until the number of winners or number of remaining candidates equals the number of maximum winners
    */

    #votes = []; // input multidimensional array of all of the votes (2-dimensional array)
    #protected_candidate; // if there is a candidate that must be saved round to round, this is where to save it (string)
    #rounds = 1; // counter for the number of rounds it has taken to run (int)
    #electionName; // name of office being sought (string)
    #numofWinners; // number of people that can be elected (int)
    #winnerExists = false; // boolean for if a winner has been found (bool)
    #winnerName = []; // array storing the name(s) of the winner(s) (1-dimensional array)
    #numOfSpotsToFill; // number of remaining spots (int)

    // Helper function to get JavaScript type equivalent to PHP's gettype()
    #getJSType(value) {
        if (Array.isArray(value)) return 'array';
        if (value === null) return 'null';
        return typeof value;
    }

    // constructor function
    // return: void
    // arguments: array (2 dimensional), string, string, int
    constructor(votes, protected_candidate, electionName, numofWinners) {
        if (!Array.isArray(votes)) {
            throw new Error("Parameter 1 (votes array) is not of type array; " + this.#getJSType(votes) + " given");
        }
        if (typeof protected_candidate !== 'string') {
            throw new Error("Parameter 2 (protected candidate) is not of type string; " + this.#getJSType(protected_candidate) + " given");
        }
        if (typeof electionName !== 'string') {
            throw new Error("Parameter 3 (election name) is not of type string; " + this.#getJSType(electionName) + " given");
        }
        if (!Number.isInteger(numofWinners)) {
            throw new Error("Parameter 4 (number of winners) is not of type integer; " + this.#getJSType(numofWinners) + " given");
        }
        this.#votes = votes; // input array of the votes
        this.#protected_candidate = protected_candidate; // candidate that cannot be eliminated between rounds
        this.#electionName = electionName; // name of the office being sought
        this.#numofWinners = numofWinners; // number of people who can win
        this.#numOfSpotsToFill = numofWinners; // number of spots left to fill
    }

    // function for telling if there is a winner
    // return: bool
    // arguments: none
    getWinnerExists() {
        return this.#winnerExists;
    }

    // function to get the office being sought
    // return: string
    // arguments: none
    getElectionName() {
        return this.#electionName;
    }

    // function to get the number of winners
    // return: int
    // arguments: none
    getNumOfWinners() {
        return this.#numofWinners;
    }

    // function for outputting the winner list
    // return: array
    // arguments: none
    getWinner() {
        return this.#winnerName;
    }

    // function to output the number of winners in the list
    // return: int
    // arguments: none
    getNumberOfConfirmedWinners() {
        return this.getWinner().length;
    }

    // function for outputting a list of all of the candidates
    // return: array
    // arguments: array
    getCandidateList(array) {
        const uniqueValues = [];
        for (const value of array) {
            if (Array.isArray(value)) {
                // If the element is an array, recursively call the function
                const recursiveValues = this.getCandidateList(value);
                uniqueValues.push(...recursiveValues);
            } else if (!uniqueValues.includes(value)) {
                // If the element is not already in the unique values array, add it
                uniqueValues.push(value);
            }
        }
        return uniqueValues;
    }

    // function to remove spoiled ballots
    // return: void
    // arguments: array
    #removeBlankArrays(array) {
        const tempArray = array.filter(subArray => {
            return subArray.length > 0;
        });
        this.#votes = tempArray;
    }

    // function for getting the number of people who voted
    // return: int
    // arguments: none
    #getNumofBallots() {
        return this.#votes.length;
    }

    // function to help determine win number
    // return: bool
    // arguments: int
    #isEven(number) {
        if (number % 2 === 0) {
            return true;
        } else {
            return false;
        }
    }

    // function for getting the win number (simple majority)
    // return: int
    // arguments: none
    getWinNumber() {
        let numOfBallots = this.#getNumofBallots();
        let winNumber = 0;
        if (this.#isEven(numOfBallots)) {
            winNumber = numOfBallots / 2;
            winNumber++;
        } else {
            numOfBallots++;
            winNumber = numOfBallots / 2;
        }
        return winNumber;
    }

    // function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the fewest votes
    // return: string
    // arguments: array (2 dimensional), string
    #getCandidateWithFewest(array, skip) {
        const votecount = {};
        const firstColumn = this.#getFirstItemInEachDimension(array);
        for (const candidate of firstColumn) {
            if (!(candidate in votecount)) {
                votecount[candidate] = 1;
            } else {
                votecount[candidate]++;
            }
        }
        
        // Sort by values (ascending) - equivalent to PHP's asort()
        const sortedEntries = Object.entries(votecount).sort(([,a], [,b]) => a - b);
        const sortedVotecount = Object.fromEntries(sortedEntries);
        
        console.log(this.#printTally(sortedVotecount));
        
        // Reverse to get descending order
        const reversedEntries = sortedEntries.reverse();
        const reversedVotecount = Object.fromEntries(reversedEntries);
        
        // Get last key (fewest votes)
        const keys = Object.keys(reversedVotecount);
        let fewest = keys[keys.length - 1];
        
        if (fewest === skip) { // if candidate cannot be removed, get next lowest
            fewest = this.#getKeyOfSecondToLastItem(reversedVotecount);
        }
        return fewest;
    }

    // function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the most votes
    // return: string
    // arguments: array (2 dimensional)
    #getCandidateWithMost(array) {
        const votecount = {};
        const firstColumn = this.#getFirstItemInEachDimension(array);
        for (const candidate of firstColumn) {
            if (!(candidate in votecount)) {
                votecount[candidate] = 1;
            } else {
                votecount[candidate]++;
            }
        }
        
        // Sort by values (ascending) - equivalent to PHP's asort()
        const sortedEntries = Object.entries(votecount).sort(([,a], [,b]) => a - b);
        // Reverse to get descending order
        const reversedEntries = sortedEntries.reverse();
        const reversedVotecount = Object.fromEntries(reversedEntries);
        
        // Get first key (most votes)
        const most = Object.keys(reversedVotecount)[0];
        return most;
    }

    // function to see if there are two candidates running in this round
    // return: int
    // arguments: array (2 dimensional)
    #getNumOfCandidatesInRound(array) {
        const votecount = {};
        const firstColumn = this.#getFirstItemInEachDimension(array);
        for (const candidate of firstColumn) {
            if (!(candidate in votecount)) {
                votecount[candidate] = 1;
            } else {
                votecount[candidate]++;
            }
        }
        const numOfCandidates = Object.keys(votecount).length;
        return numOfCandidates;
    }

    // if there is a candidate that cannot be removed, get the candidate with the second-fewest number of votes
    // return: string
    // arguments: array (1 dimensional)
    #getKeyOfSecondToLastItem(array) {
        const keys = Object.keys(array);
        if (keys.length >= 2) {
            const secondToLastKey = keys[keys.length - 2];
            return secondToLastKey;
        } else {
            return null; // Return null if there are fewer than two elements in the array.
        }
    }

    // function for seeing how many votes each person got in that round
    // return: void
    // arguments: array (1 dimensional)
    #printTally(array) {
        // Reverse the array (get descending order)
        const reversedEntries = Object.entries(array).reverse();
        const reversedArray = Object.fromEntries(reversedEntries);
        
        let output = '';
        for (const [key, value] of Object.entries(reversedArray)) {
            output += key + ": " + value + " votes<br />\r\n";
        }
        return output;
    }

    // function to remove the person from the entire array
    // return: void
    // arguments: array (2 dimensional), string
    #removeCandidate(array, search) {
        for (let key = 0; key < array.length; key++) {
            const value = array[key];
            if (Array.isArray(value)) {
                this.#removeCandidate(value, search);
            } else if (typeof value === 'string' && value.indexOf(search) !== -1) {
                array.splice(key, 1);
                key--; // Adjust index after removal
            }
        }
        // Remove empty arrays and reindex
        for (let i = array.length - 1; i >= 0; i--) {
            if (Array.isArray(array[i]) && array[i].length === 0) {
                array.splice(i, 1);
            }
        }
    }

    // function for getting the first item in the first dimension of each element of the array (i.e. the list of candidates from that round)
    // return: array (1 dimensional)
    // arguments: array (2 dimensional)
    #getFirstItemInEachDimension(array) {
        const firstItems = [];
        for (const subArray of array) {
            if (Array.isArray(subArray) && subArray.length > 0) {
                firstItems.push(subArray[0]);
            }
        }
        return firstItems;
    }

    // function for adding a winner to the winner array
    // return: void
    // arguments: string
    #addWinner(winner) {
        this.#winnerName.push(winner);
    }

    // function to get the list of candidates left (basically the same as getCandidateList() but private)
    // return: array
    // arguments: none
    #findUniqueVotesLeft() {
        const flattenedArray = this.#votes.reduce((acc, val) => acc.concat(val), []);
        const uniqueItems = [...new Set(flattenedArray)];
        return uniqueItems;
    }

    // function to get number of candidates left in the race
    // return: int
    // arguments: none
    #findNumOfUniqueVotesLeft() {
        const uniqueItems = this.#findUniqueVotesLeft();
        const arrayLen = uniqueItems.length;
        return arrayLen;
    }

    // function to get the number of spots left
    // return: int
    // arguments: none
    #getNumberOfSpotsToFill() {
        return this.#numOfSpotsToFill;
    }

    // function to reduce the number of spots left by 1
    // return: void
    // arguments: none
    #reduceNumberOfRemainingSpotsByOne() {
        this.#numOfSpotsToFill--;
    }

    // function for if we are in the last round before figuring out who won
    // return: string
    // arguments: array (2 dimensional)
    #finalCandidatesRound(array) {
        const votecount = {};
        const firstColumn = this.#getFirstItemInEachDimension(array);
        for (const candidate of firstColumn) {
            if (!(candidate in votecount)) {
                votecount[candidate] = 1;
            } else {
                votecount[candidate]++;
            }
        }
        
        // Sort by values (ascending) - equivalent to PHP's asort()
        const sortedEntries = Object.entries(votecount).sort(([,a], [,b]) => a - b);
        // Reverse to get descending order
        const reversedEntries = sortedEntries.reverse();
        const reversedVotecount = Object.fromEntries(reversedEntries);
        
        for (const [key, value] of Object.entries(reversedVotecount)) {
            console.log(key + ": " + value + " votes<br />\r\n");
        }
        
        // Get last key (fewest votes)
        const keys = Object.keys(reversedVotecount);
        const fewest = keys[keys.length - 1];
        return fewest;
    }

    // function for determining who got the fewest votes and removing them from all ballots; if only two are competing in the round, remove the lowest
    // return: void
    // arguments: none
    #conductRound() {
        if (this.#getNumOfCandidatesInRound(this.#votes) === 2) {
            const candidateToRemove = this.#getCandidateWithFewest(this.#votes, "Name of a candidate that does not exist");
            const candidateThatWonRound = this.#getCandidateWithMost(this.#votes);
            this.#addWinner(candidateThatWonRound);
            this.#reduceNumberOfRemainingSpotsByOne();
            console.log(candidateToRemove + " was eliminated<br />\r\n");
            console.log(candidateThatWonRound + " won round<br />\r\n\r\n");
        } else {
            const candidateToRemove = this.#getCandidateWithFewest(this.#votes, this.#protected_candidate);
            console.log(candidateToRemove + " was eliminated<br />\r\n\r\n");
        }
        this.#removeCandidate(this.#votes, candidateToRemove);
    }

    // function to increment the number of rounds
    // return: void
    // arguments: none
    #increaseRound() {
        this.#rounds++;
    }

    // function for getting number of candidates that have yet to be eliminated
    // return: int
    // arguments: none
    #numOfCandidatesLeft() {
        const candidateList = this.#findUniqueVotesLeft();
        return candidateList.length;
    }

    // function to see if the top vote-getter is over the threshold of votes; if so, remove them from the list
    // return: array
    // arguments: array (2 dimensional)
    #seeIfTopVoteGetterIsOverWinNum(array) {
        const returnArray = [];
        const votecount = {};
        const firstColumn = this.#getFirstItemInEachDimension(array);
        for (const candidate of firstColumn) {
            if (!(candidate in votecount)) {
                votecount[candidate] = 1;
            } else {
                votecount[candidate]++;
            }
        }
        
        // Sort by values (ascending) - equivalent to PHP's asort()
        const sortedEntries = Object.entries(votecount).sort(([,a], [,b]) => a - b);
        // Reverse to get descending order
        const reversedEntries = sortedEntries.reverse();
        const reversedVotecount = Object.fromEntries(reversedEntries);
        
        let voteCountOutput = "";
        for (const [key, value] of Object.entries(reversedVotecount)) {
            voteCountOutput += key + ": " + value + " votes<br />\r\n";
            if (value >= this.getWinNumber()) {
                returnArray.push(key);
            }
        }
        if (returnArray.length > 0) {
            console.log(voteCountOutput);
        }
        return returnArray;
    }

    // function to handle situation where, in the end, the protected candidate is in last place
    // return: bool
    // arguments: array
    #protectedCandidateInLastAtEnd(array) {
        // Only use this function in the edge case since it happens only when there are 2 or more winners
        if ((this.#numOfCandidatesLeft() === this.#getNumberOfSpotsToFill() + 1) && this.#numofWinners > 1) {
            // do a dummy round and see who came in last
            const votecount = {};
            const firstColumn = this.#getFirstItemInEachDimension(array);
            for (const candidate of firstColumn) {
                if (!(candidate in votecount)) {
                    votecount[candidate] = 1;
                } else {
                    votecount[candidate]++;
                }
            }
            
            // Sort by values (ascending) - equivalent to PHP's asort()
            const sortedEntries = Object.entries(votecount).sort(([,a], [,b]) => a - b);
            // Reverse to get descending order
            const reversedEntries = sortedEntries.reverse();
            const reversedVotecount = Object.fromEntries(reversedEntries);

            for (const [key, value] of Object.entries(reversedVotecount)) {
                console.log(key + ": " + value + " votes<br />\r\n");
            }

            // Get last key (fewest votes)
            const keys = Object.keys(reversedVotecount);
            const fewest = keys[keys.length - 1];

            // the protected candidate is the one in last, that's the one to remove
            if (fewest === this.#protected_candidate) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    // function for conducting the election
    // return: void
    // arguments: none
    conductElection() {
        console.log("<h2>" + this.#electionName + "</h2>\r\n");
        console.log("<h2>Number of winners: " + this.getNumOfWinners() + "</h2>\r\n");
        console.log("<h2>Win Number: " + this.getWinNumber() + "</h2>\r\n\r\n");
        
        while (this.#getNumberOfSpotsToFill() > 0) {
            console.log("<h3>Round " + this.#rounds + "</h3>\r\n");
            console.log("Number of candidates left: " + this.#findNumOfUniqueVotesLeft() + "<br />\r\n");
            const candidateOverThreshold = this.#seeIfTopVoteGetterIsOverWinNum(this.#votes);
            
            // if a candidate is over the win number, remove from the list
            if (candidateOverThreshold.length > 0) {
                for (let i = 0; i < candidateOverThreshold.length; i++) {
                    this.#addWinner(candidateOverThreshold[i]);
                    this.#removeCandidate(this.#votes, candidateOverThreshold[i]);
                    this.#reduceNumberOfRemainingSpotsByOne();
                    console.log(candidateOverThreshold[i] + " has passed the threshold of " + this.getWinNumber() + " votes and will be removed from contention<br />\r\n");
                    console.log("Spots remaining: " + this.#getNumberOfSpotsToFill() + "<br />\r\n\r\n");
                }
            }
            // handle special case where the protected candidate is in last
            else if (this.#protectedCandidateInLastAtEnd(this.#votes)) {
                console.log(this.#protected_candidate + " is in last place and will be removed from contention<br />\r\n\r\n");
                this.#removeCandidate(this.#votes, this.#protected_candidate);
            }
            // if we're down to the final candidates, find the one with the higher of the two
            else if (this.#numOfCandidatesLeft() - 1 === this.#getNumberOfSpotsToFill()) {
                const winner = this.#finalCandidatesRound(this.#votes);
                this.#addWinner(winner);
                this.#removeCandidate(this.#votes, winner);
                this.#reduceNumberOfRemainingSpotsByOne();
                console.log(winner + " wins last round and is a winner<br />\r\n");
            } else {
                this.#conductRound();
            }
            this.#removeBlankArrays(this.#votes);
            this.#increaseRound();
        }
        
        if (this.#getNumberOfSpotsToFill() === 0) {
            this.#winnerExists = true;
            const winnerList = this.getWinner();
            if (winnerList.length === 1) {
                console.log("<p><strong>" + winnerList[0] + " is elected as " + this.getElectionName() + "</strong></p>\r\n");
            } else {
                let output = "<p><strong>";
                for (let x = 0; x < winnerList.length; x++) {
                    if (x === winnerList.length - 1) {
                        output += winnerList[x];
                    } else {
                        output += winnerList[x] + ", ";
                    }
                }
                output += " are elected as " + this.getElectionName() + "</strong></p>\r\n";
                console.log(output);
            }
        }
    }
}
