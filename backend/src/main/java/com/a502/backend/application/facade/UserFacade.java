package com.a502.backend.application.facade;

import com.a502.backend.application.config.dto.JWTokenDto;
import com.a502.backend.application.entity.*;
import com.a502.backend.domain.account.AccountService;
import com.a502.backend.domain.allowance.request.CalendarDTO;
import com.a502.backend.domain.parking.ParkingDetailsService;
import com.a502.backend.domain.parking.ParkingService;
import com.a502.backend.domain.savings.SavingsService;
import com.a502.backend.domain.stock.RankService;
import com.a502.backend.domain.stock.StockDetailsService;
import com.a502.backend.domain.stock.StockHoldingsService;
import com.a502.backend.domain.stock.StocksService;
import com.a502.backend.domain.user.TemporaryUserRepository;
import com.a502.backend.domain.user.UserService;
import com.a502.backend.domain.user.dto.LoginDto;
import com.a502.backend.domain.user.dto.SignUpDto;
import com.a502.backend.domain.user.response.UserAccountInfoResponse;
import com.a502.backend.domain.user.response.UserChildrenInfoResponse;
import com.a502.backend.domain.user.response.UserInfoResponse;
import com.a502.backend.domain.user.response.UserMyPageResponse;
import com.a502.backend.global.code.CodeService;
import com.a502.backend.global.error.BusinessException;
import com.a502.backend.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Transactional
@RequiredArgsConstructor
@Service
public class UserFacade {

	private final UserService userService;
	private final AccountService accountService;
	private final TemporaryUserRepository temporaryUserRepository;
	private final ParkingService parkingService;
	private final CodeService codeService;
	private final ParkingDetailsService parkingDetailsService;
	private final StocksService stocksService;
	private final StockDetailsService stockDetailsService;
	private final StockHoldingsService stockHoldingsService;
	private final RankService rankService;
	private final SavingsService savingsService;
	private final AllowanceFacade allowanceFacade;


	@Transactional
	public User signup(String temporaryUserUuid, SignUpDto signUpDto, String parentName) throws IOException {

		UUID uuid = userService.convertToUuid(temporaryUserUuid);
		TemporaryUser temporaryUser = findTemporaryUser(uuid);

		userService.checkDupleUser(temporaryUser);

		User parent = userService.findUser(parentName);
		User user = userService.convertToUserEntity(signUpDto, temporaryUser, parent);

		userService.save(user);
		temporaryUserRepository.delete(temporaryUser);

		if (parent != null) {
			Parking parkingAccount = parkingService.createParkingAccount(user);

			Code initCode = codeService.findTypeCode("시드머니");
			parkingDetailsService.initSeadMoney(parkingAccount, initCode);


			List<Stock> stocks = stocksService.findAllList();
			HashMap<String, Integer> stockStartPriceList = stockDetailsService.getStockStartPriceList(stocks);
			stockHoldingsService.initStockHolding(user, stocks, stockStartPriceList);
		}

		return user;
	}

	public JWTokenDto login(LoginDto loginDto) {
		return userService.login(loginDto);
	}

	@Transactional
	public void checkDupleEmail(String temporaryUserUuidString, String email) {

		UUID uuid = userService.convertToUuid(temporaryUserUuidString);

		userService.findUserByEmail(email);

		TemporaryUser temporaryUser = temporaryUserRepository.findByTemporaryUserUuid(uuid)
				.orElseThrow(() -> BusinessException.of(ErrorCode.API_ERROR_TEMPORARY_UUID_NOT_EXIST));

		temporaryUser.updateEmail(email);
	}


	@Transactional
	public UUID checkDupleTelephone(String telephone) {

		userService.findUserByTelephone(telephone);

		TemporaryUser newUser = TemporaryUser.builder()
				.telephone(telephone)
				.build();

		TemporaryUser temporaryUser = temporaryUserRepository.save(newUser);

		return temporaryUser.getTemporaryUserUuid();
	}


	public TemporaryUser findTemporaryUser(UUID uuid) {

		TemporaryUser temporaryUser = temporaryUserRepository.findByTemporaryUserUuid(uuid)
				.orElseThrow(() -> BusinessException.of(ErrorCode.API_ERROR_TEMPORARY_UUID_NOT_EXIST));

		return temporaryUser;
	}


	public UserMyPageResponse mypageInfo() {
		User user = userService.userFindByEmail();
		String[] date = getMonthDate();
		return getfinInfo(user, date[0], date[1]);
	}

	public UserMyPageResponse getfinInfo(User user, String startDate, String endDate) {
		String name = user.getName();
		boolean isParent = (user.getParent() == null) ? true : false;
		String accountNumber = accountService.findDefaultAccountByUser(user).getAccountNumber();
		int balance = accountService.findDefaultAccountByUser(user).getBalance();

		if (!isParent) {
			int savings = accountService.findSavingsMoneyByChild(user);
			int ranking = getMyRanking(user);
			int chocochip = parkingService.getParkingBalance(user);
			int monthAmounts = allowanceFacade.getTransactionsForPeriod(CalendarDTO.builder()
					.startDate(startDate)
					.endDate(endDate)
					.childUuid(user.getUserUuid().toString())
					.build()).getIncomeMonth();
			int totalIncome = 0;
			int totalPrice = 0;
			double totalIncomePercent;
			List<StockHolding> stockHoldingList = stockHoldingsService.findAllByUser(user);
			for (StockHolding sh : stockHoldingList) {
				Stock stock = stocksService.findById(sh.getStock().getId());
				StockDetail stockDetail = stockDetailsService.getLastDetail(stock);
				int totalPriceAvg = sh.getTotal();
				int totalPriceCur = sh.getCnt() * stockDetail.getPrice();
				int income = totalPriceCur - totalPriceAvg;
				totalIncome += income;
				totalPrice += totalPriceCur;
			}

			if (totalPrice - totalIncome == 0)
				totalIncomePercent = 0;
			else totalIncomePercent = (double) totalIncome / (totalPrice - totalIncome) * 100.0;

			String formatted = String.format("%.2f", totalIncomePercent);
			return new UserMyPageResponse(name, isParent, accountNumber, balance, savings, monthAmounts, ranking, chocochip, totalIncome, totalPrice, formatted);
		} else return new UserMyPageResponse(name, isParent, accountNumber, balance, -1, -1, -1, -1, -1, -1, "");
	}

	public UserInfoResponse userInfo() {
		User user = userService.userFindByEmail();
		return getUserInfo(user);
	}

	public UserChildrenInfoResponse getChildrenInfo() {
		List<UserInfoResponse> response = new ArrayList<>();
		User user = userService.userFindByEmail();
		if (user.getParent() != null)
			throw BusinessException.of(ErrorCode.API_ERROR_USER_NOT_PARENT);
		List<User> children = userService.findMyKidsByParents(user);
		for (User child : children) {
			response.add(getUserInfo(child));
		}
		return new UserChildrenInfoResponse(response);
	}

	public UserInfoResponse getUserInfo(User user) {
		String userUuid = user.getUserUuid().toString();
		String name = user.getName();
		String email = user.getEmail();
		boolean isParent = (user.getParent() == null) ? true : false;
		Date createdAt = Date.from(user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant());
		String address = user.getAddress();
		String address2 = user.getAddress2();
		String telephone = user.getTelephone();
		Account account = accountService.findMyKidsDefaultAccount(user);
		if (account != null) {
			String accountNumber = account.getAccountNumber();
			String accountUuid = account.getAccountUuid().toString();
			return new UserInfoResponse(userUuid, name, email, isParent, createdAt, address, address2, telephone, accountUuid, accountNumber);
		}
		return UserInfoResponse.builder().userUuid(userUuid).name(name).email(email).isParent(isParent).createdAt(createdAt).address(address).address2(address2).telephone(telephone).build();
	}

	public UserAccountInfoResponse getUserAccountInfo() {
		User user = userService.userFindByEmail();
		Account account = accountService.findDefaultAccountByUser(user);
		String accountUuid = account.getAccountUuid().toString();
		int balance = account.getBalance();
		int savings = accountService.findSavingsMoneyByChild(user);
		String[] date = getMonthDate();
		int monthAmounts = allowanceFacade.getTransactionsForPeriod(CalendarDTO.builder()
				.startDate(date[0])
				.endDate(date[1])
				.childUuid(user.getUserUuid().toString())
				.build()).getIncomeMonth();
		return new UserAccountInfoResponse(accountUuid, balance, savings, monthAmounts);
	}

	public String[] getMonthDate() {
		Date today = new Date();
		LocalDate localDate = new java.sql.Date(today.getTime()).toLocalDate();

		LocalDate firstDayOfMonth = localDate.withDayOfMonth(1);
		LocalDate lastDayOfMonth = localDate.withDayOfMonth(localDate.lengthOfMonth());

		DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

		String formattedFirstDay = firstDayOfMonth.format(formatter);
		String formattedLastDay = lastDayOfMonth.format(formatter);
		return new String[]{formattedFirstDay, formattedLastDay};
	}

	public int getMyRanking(User user) {
		Long temp = rankService.getUserRank(user);
		if (temp == null) return 0;
		int rank = Math.toIntExact(temp);
		;

		List<RankingDetail> rankingList = getTop10UserRankings();
		for (RankingDetail detail : rankingList) {
			if (detail.getChildName().equals(user.getName()))
				return detail.getRank();
		}

		return rank;
	}

	public List<RankingDetail> getTop10UserRankings() {
		Set<ZSetOperations.TypedTuple<String>> top10UsersWithScores = rankService.getTop10Users();
		List<RankingDetail> userRankings = new ArrayList<>();
		int rank = 1;
		int prevRank = 1;
		int prevBalance = 0;
		for (ZSetOperations.TypedTuple<String> userWithScore : top10UsersWithScores) {
			if (prevBalance == 0)
				prevBalance = userWithScore.getScore().intValue();
			int balance = userWithScore.getScore().intValue();
			int curRank = (balance == prevBalance) ? prevRank : rank;
			RankingDetail userRanking = RankingDetail.builder()
					.childName(userWithScore.getValue())
					.rank(curRank)
					.balance(balance)
					.build();
			userRankings.add(userRanking);

			prevBalance = balance;
			prevRank = curRank;
			rank++;
		}
		return userRankings;
	}


}
