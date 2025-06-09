
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

	private votes: string[][] = []; // input multidimensional array of all of the votes (2-dimensional array)
	private protectedCandidate: string; // if there is a candidate that must be saved round to round, this is where to save it (string)
	private rounds: number = 1; // counter for the number of rounds it has taken to run (int)
	private electionName: string; // name of office being sought (string)
	private numofWinners: number; // number of people that can be elected (int)
	private winnerExists: boolean = false; // boolean for if a winner has been found (bool)
	private winnerName: string[] = []; // array storing the name(s) of the winner(s) (1-dimensional array)
	private numOfSpotsToFill: number; // number of remaining spots (int)

	// constructor function
	// return: void
	// arguments: array (2 dimensional), string, string, int
	public constructor(votes: string[][], protectedCandidate: string, electionName: string, numofWinners: number){ 
        	if(!Array.isArray(votes)){
			throw new Error("Parameter 1 (votes array) is not of type array; " + typeof votes + " given");
		}
		if(typeof protectedCandidate !== 'string'){
			throw new Error("Parameter 2 (protected candidate) is not of type string; " + typeof protectedCandidate + " given");
		}
		if(typeof electionName !== 'string'){
			throw new Error("Parameter 3 (election name) is not of type string; " + typeof electionName + " given");
		}
		if(typeof numofWinners !== 'number' || !Number.isInteger(numofWinners)){
			throw new Error("Parameter 4 (number of winners) is not of type integer; " + typeof numofWinners + " given");
		}
		this.votes = votes; // input array of the votes
		this.protectedCandidate = protectedCandidate; // candidate that cannot be eliminated between rounds
		this.electionName = electionName; // name of the office being sought
		this.numofWinners = numofWinners; // number of people who can win
		this.numOfSpotsToFill = numofWinners; // number of spots left to fill
    	}
	
	// function for telling if there is a winner
	// return: bool
	// arguments: none
	public getWinnerExists(): boolean{
		return this.winnerExists;
	}
	
	// function to get the office being sought
	// return: string
	// arguments: none
	public getElectionName(): string{
		return this.electionName;
	}
	
	// function to get the number of winners
	// return: int
	// arguments: none
	public getNumOfWinners(): number{
		return this.numofWinners;
	}
	
	// function for outputting the winner list
	// return: array
	// arguments: none
	public getWinner(): string[]{
		return this.winnerName;
	}
	
	// function to output the number of winners in the list
	// return: int
	// arguments: none
	public getNumberOfConfirmedWinners(): number{
		return this.getWinner().length;
	}
	
	// function for outputting a list of all of the candidates
	// return: array
	// arguments: array
	public getCandidateList(array: any[]): string[]{
		const uniqueValues: string[] = [];
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
	private removeBlankArrays(array: string[][]): void{
		const tempArray = array.filter(function(subArray) {
			return subArray.length > 0;
		});
		this.votes = tempArray;
	}
	
	// function for getting the number of people who voted
	// return: int
	// arguments: none
	private getNumofBallots(): number{
		return this.votes.length;
	}
	
	// function to help determine win number
	// return: bool
	// arguments: int
	private isEven(number: number): boolean{ 
		if(number % 2 == 0){ 
			return true; 
		} 
		else{ 
			return false;
		} 
	}
	
	// function for getting the win number (simple majority)
	// return: int
	// arguments: none
	public getWinNumber(): number{
		const numOfBallots = this.getNumofBallots();
		let winNumber = 0;
		if(this.isEven(numOfBallots)){
			winNumber = numOfBallots/2;
			winNumber++;
		}
		else{
			const adjustedBallots = numOfBallots + 1;
			winNumber = adjustedBallots/2;
		}
		return winNumber;
	}
	
	// function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the fewest votes
	// return: string
	// arguments: array (2 dimensional), string
	private getCandidateWithFewest(array: string[][], skip: string): string{
		const votecount: { [key: string]: number } = {};
		const firstColumn = this.getFirstItemInEachDimension(array);
		for (const candidate of firstColumn) {
			if(!(candidate in votecount))
			{
				votecount[candidate] = 1;
			}
			else{
				votecount[candidate]++;
			}
		}
		const sortedEntries = Object.entries(votecount).sort((a, b) => a[1] - b[1]);
		const sortedVotecount: { [key: string]: number } = {};
		for (const [key, value] of sortedEntries) {
			sortedVotecount[key] = value;
		}
		this.printTally(sortedVotecount);
		const reversedEntries = sortedEntries.reverse();
		const reversedVotecount: { [key: string]: number } = {};
		for (const [key, value] of reversedEntries) {
			reversedVotecount[key] = value;
		}
		const keys = Object.keys(reversedVotecount);
		let fewest = keys[keys.length - 1];
		if(fewest == skip){ // if candidate cannot be removed, get next lowest
			fewest = this.getKeyOfSecondToLastItem(reversedVotecount);
		}
		return fewest;
	}
	
	// function to search through the first item in each ballot (ballot = 1st dimension of the array) and find the person who got the most votes
	// return: string
	// arguments: array (2 dimensional)
	private getCandidateWithMost(array: string[][]): string{
		const votecount: { [key: string]: number } = {};
		const firstColumn = this.getFirstItemInEachDimension(array);
		for (const candidate of firstColumn) {
			if(!(candidate in votecount))
			{
				votecount[candidate] = 1;
			}
			else{
				votecount[candidate]++;
			}
		}
		const sortedEntries = Object.entries(votecount).sort((a, b) => a[1] - b[1]);
		const reversedEntries = sortedEntries.reverse();
		const reversedVotecount: { [key: string]: number } = {};
		for (const [key, value] of reversedEntries) {
			reversedVotecount[key] = value;
		}
		const keys = Object.keys(reversedVotecount);
		const most = keys[0];
		return most;
	}
	
	// function to see if there are two candidates running in this round
	// return: int
	// arguments: array (2 dimensional)
	private getNumOfCandidatesInRound(array: string[][]): number{
		const votecount: { [key: string]: number } = {};
		const firstColumn = this.getFirstItemInEachDimension(array);
		for (const candidate of firstColumn) {
			if(!(candidate in votecount))
			{
				votecount[candidate] = 1;
			}
			else{
				votecount[candidate]++;
			}
		}
		const numOfCandidates = Object.keys(votecount).length;
		return numOfCandidates;
	}
	
	// if there is a candidate that cannot be removed, get the candidate with the second-fewest number of votes
	// return: string
	// arguments: array (1 dimensional)
	private getKeyOfSecondToLastItem(array: { [key: string]: number }): string{
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
	private printTally(array: { [key: string]: number }): void{
		const reversedEntries = Object.entries(array).reverse();
		const reversedArray: { [key: string]: number } = {};
		for (const [key, value] of reversedEntries) {
			reversedArray[key] = value;
		}
		for(const [key, value] of Object.entries(reversedArray)) {
			console.log(key + ": " + value + " votes<br />\r\n");
		}
	}
	
	// function to remove the person from the entire array
	// return: void
	// arguments: array (2 dimensional), string
	private removeCandidate(array: string[][], search: string): void{
		for (let i = 0; i < array.length; i++) {
			const value = array[i];
			if (Array.isArray(value)) {
				this.removeCandidate([value] as string[][], search);
			} else {
				// Remove elements that match the search string
				array[i] = array[i].filter(item => item.indexOf(search) === -1);
			}
		}
		// Remove empty sub-arrays and reindex
		this.votes = this.votes.filter(subArray => subArray.length > 0);
	}
	
	// function for getting the first item in the first dimension of each element of the array (i.e. the list of candidates from that round)
	// return: array (1 dimensional)
	// arguments: array (2 dimensional)
	private getFirstItemInEachDimension(array: string[][]): string[]{
		const firstItems: string[] = [];
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
	private addWinner(winner: string): void{
		this.winnerName.push(winner);
	}
	
	// function to get the list of candidates left (basically the same as getCandidateList() but private)
	// return: array
	// arguments: none
	private findUniqueVotesLeft(): string[]{
		const flattenedArray = this.votes.reduce((acc, val) => acc.concat(val), []);
		const uniqueItems = [...new Set(flattenedArray)];
		return uniqueItems;
	}
	
	// function to get number of candidates left in the race
	// return: int
	// arguments: none
	private findNumOfUniqueVotesLeft(): number{
		const uniqueItems = this.findUniqueVotesLeft();
		const arrayLen = uniqueItems.length;
		return arrayLen;
	}
	
	// function to get the number of spots left
	// return: int
	// arguments: none
	private getNumberOfSpotsToFill(): number{
		return this.numOfSpotsToFill;
	}
	
	// function to reduce the number of spots left by 1
	// return: void
	// arguments: none
	private reduceNumberOfRemainingSpotsByOne(): void{
		this.numOfSpotsToFill--;
	}
	
	// function for if we are in the last round before figuring out who won
	// return: string
	// arguments: array (2 dimensional)
	private finalCandidatesRound(array: string[][]): string{
		const votecount: { [key: string]: number } = {};
		const firstColumn = this.getFirstItemInEachDimension(array);
		for (const candidate of firstColumn) {
			if(!(candidate in votecount))
			{
				votecount[candidate] = 1;
			}
			else{
				votecount[candidate]++;
			}
		}
		const sortedEntries = Object.entries(votecount).sort((a, b) => a[1] - b[1]);
		const reversedEntries = sortedEntries.reverse();
		const reversedVotecount: { [key: string]: number } = {};
		for (const [key, value] of reversedEntries) {
			reversedVotecount[key] = value;
		}
		for (const [key, value] of Object.entries(reversedVotecount)) {
			console.log(key + ": " + value + " votes<br />\r\n");
		}
		const keys = Object.keys(reversedVotecount);
		const fewest = keys[keys.length - 1];
		return fewest;
	}
	
	// function for determining who got the fewest votes and removing them from all ballots; if only two are competing in the round, remove the lowest
	// return: void
	// arguments: none
	private conductRound(): void{
		if(this.getNumOfCandidatesInRound(this.votes) == 2){
			const candidateToRemove = this.getCandidateWithFewest(this.votes,"Name of a candidate that does not exist");
			const candidateThatWonRound = this.getCandidateWithMost(this.votes);
			this.addWinner(candidateThatWonRound);
			this.reduceNumberOfRemainingSpotsByOne();
			console.log(candidateToRemove + " was eliminated<br />\r\n");
			console.log(candidateThatWonRound + " won round<br />\r\n\r\n");
		}
		else{		
			const candidateToRemove = this.getCandidateWithFewest(this.votes,this.protectedCandidate);
			console.log(candidateToRemove + " was eliminated<br />\r\n\r\n");
		}
		this.removeCandidate(this.votes, candidateToRemove);
	}
	
	// function to increment the number of rounds
	// return: void
	// arguments: none
	private increaseRound(): void{
		this.rounds++;
	}
	
	// function for getting number of candidates that have yet to be eliminated
	// return: int
	// arguments: none
	private numOfCandidatesLeft(): number{
		const candidateList = this.findUniqueVotesLeft();
		return candidateList.length;
	}
	
	// function to see if the top vote-getter is over the threshold of votes; if so, remove them from the list
	// return: array
	// arguments: array (2 dimensional)
	private seeIfTopVoteGetterIsOverWinNum(array: string[][]): string[]{
		const returnArray: string[] = [];
		const votecount: { [key: string]: number } = {};
		const firstColumn = this.getFirstItemInEachDimension(array);
		for (const candidate of firstColumn) {
			if(!(candidate in votecount))
			{
				votecount[candidate] = 1;
			}
			else{
				votecount[candidate]++;
			}
		}
		const sortedEntries = Object.entries(votecount).sort((a, b) => a[1] - b[1]);
		const reversedEntries = sortedEntries.reverse();
		const reversedVotecount: { [key: string]: number } = {};
		for (const [key, value] of reversedEntries) {
			reversedVotecount[key] = value;
		}
		let voteCountOutput = "";
		for (const [key, value] of Object.entries(reversedVotecount)) {
			voteCountOutput += key + ": " + value + " votes<br />\r\n";
			if(value >= this.getWinNumber())
			{
				returnArray.push(key);
			}
		}
		if(returnArray.length > 0){
			console.log(voteCountOutput);
		}
		return returnArray;
	}
	
	// function to handle situation where, in the end, the protected candidate is in last place
	// return: bool
	// arguments: array
	private protectedCandidateInLastAtEnd(array: string[][]): boolean {
	
		// Only use this function in the edge case since it happens only when there are 2 or more winners
		if((this.numOfCandidatesLeft() == this.getNumberOfSpotsToFill()+1) && this.numofWinners > 1)
		{
			// do a dummy round and see who came in last
			const votecount: { [key: string]: number } = {};
			const firstColumn = this.getFirstItemInEachDimension(array);
			for (const candidate of firstColumn) {
				if(!(candidate in votecount))
				{
					votecount[candidate] = 1;
				}
				else{
					votecount[candidate]++;
				}
			}
			const sortedEntries = Object.entries(votecount).sort((a, b) => a[1] - b[1]);
			const reversedEntries = sortedEntries.reverse();
			const reversedVotecount: { [key: string]: number } = {};
			for (const [key, value] of reversedEntries) {
				reversedVotecount[key] = value;
			}
			
			for (const [key, value] of Object.entries(reversedVotecount)) {
				console.log(key + ": " + value + " votes<br />\r\n");
			}
			
			const keys = Object.keys(reversedVotecount);
			const fewest = keys[keys.length - 1];
			
			// the protected candidate is the one in last, that's the one to remove
			if(fewest == this.protectedCandidate)
			{
				return true;
			}
			else{
				return false;
			}
		}
		else{
			return false;
		}
	}
	
	// function for conducting the election
	// return: void
	// arguments: none
	public conductElection(): void{
		console.log("<h2>" + this.electionName + "</h2>\r\n");
		console.log("<h2>Number of winners: " + this.getNumOfWinners() + "</h2>\r\n");
		console.log("<h2>Win Number: " + this.getWinNumber() + "</h2>\r\n\r\n");
		while(this.getNumberOfSpotsToFill()>0)
		{
			console.log("<h3>Round "+ this.rounds+"</h3>\r\n");
			console.log("Number of candidates left: " + this.findNumOfUniqueVotesLeft() + "<br />\r\n");
			const candidateOverThreshold = this.seeIfTopVoteGetterIsOverWinNum(this.votes);
			// if a candidate is over the win number, remove from the list
			if(candidateOverThreshold.length > 0){
				
				for(let i=0; i<candidateOverThreshold.length;i++){
					this.addWinner(candidateOverThreshold[i]);
					this.removeCandidate(this.votes,candidateOverThreshold[i]);
					this.reduceNumberOfRemainingSpotsByOne();
					console.log(candidateOverThreshold[i] + " has passed the threshold of "+ this.getWinNumber() + " votes and will be removed from contention<br />\r\n");
					console.log("Spots remaining: " + this.getNumberOfSpotsToFill() + "<br />\r\n\r\n");
				}
			}
			
			// handle special case where the protected candidate is in last
			else if(this.protectedCandidateInLastAtEnd(this.votes)){
				console.log(this.protectedCandidate + " is in last place and will be removed from contention<br />\r\n\r\n");
				this.removeCandidate(this.votes,this.protectedCandidate);
			}
			
			// if we're down to the final candidates, find the one with the higher of the two
			else if(this.numOfCandidatesLeft()-1 == this.getNumberOfSpotsToFill()){
				const winner = this.finalCandidatesRound(this.votes);
				this.addWinner(winner);
				this.removeCandidate(this.votes,winner);
				this.reduceNumberOfRemainingSpotsByOne();
				console.log(winner + " wins last round and is a winner<br />\r\n");
			}
			else{
				this.conductRound();				
			}
			this.removeBlankArrays(this.votes);
			this.increaseRound();
		}
		if(this.getNumberOfSpotsToFill() == 0){
			this.winnerExists = true;
			const winnerList = this.getWinner();
			if(winnerList.length == 1){
				console.log("<p><strong>"+ winnerList[0] + " is elected as "+ this.getElectionName() +"</strong></p> \r\n");
			}
			else{
				console.log("<p><strong>");
				for(let x = 0; x < winnerList.length; x++){
					if(x == winnerList.length-1){
						console.log(winnerList[x]);
					}
					else{
						console.log(winnerList[x] + ", ");
					}
				}
				console.log(" are elected as "+ this.getElectionName() +"</strong></p> \r\n");
			}
		}
	}
}
